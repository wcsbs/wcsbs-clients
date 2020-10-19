/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const MASTER_KEY = { useMasterKey: true };
const MAX_QUERY_COUNT = 3000;
const logger = require("parse-server").logger;

const requireAuth = user => {
  if (!user) throw new Error("User must be authenticated!");
  Parse.Cloud.useMasterKey();
};

const requireRole = (userWithRoles, role) => {
  if (!userWithRoles) throw new Error("User must be authenticated!");
  if (!userWithRoles.roles.includes(role)) {
    throw new Error(`User must be ${role}!`);
  }
};

const loadStudentAttendanceV2 = async function(userId, classSession) {
  logger.info(
    `loadStudentAttendanceV2 - userId: ${userId} classSession: ${classSession}`
  );

  var result = {};
  if (classSession) {
    var query = new Parse.Query("UserSessionAttendance");
    query.equalTo("userId", userId);
    query.equalTo("sessionId", classSession._getId());
    const parseUserSessionAttendance = await query.first();

    if (parseUserSessionAttendance) {
      result.attendance = parseUserSessionAttendance.get("attendance");
      result.onLeave = parseUserSessionAttendance.get("onLeave");
    }
  }

  logger.info(`loadStudentAttendanceV2 - result: ${JSON.stringify(result)}`);

  return result;
};

const loadPracticeSubmodules = async function(moduleId) {
  if (moduleId) {
    var query = new Parse.Query("Submodule");
    query.equalTo("moduleId", moduleId);
    query.ascending("index");
    var practiceSubmodules = await query.limit(MAX_QUERY_COUNT).find();
    return practiceSubmodules.map(e => {
      return { id: e.id, name: e.get("name"), url: e.get("url") };
    });
  }
  return [];
};

const loadStudentPracticeDetailsV2 = async function(
  userId,
  classInfo,
  practices
) {
  logger.info(`loadStudentPracticeDetailsV2 - userId: ${userId}`);

  if (practices && practices.length > 0) {
    for (var i = 0; i < practices.length; i++) {
      var practiceCount = {};
      var relation = practices[i].relation("counts");
      var query = relation.query();
      query.equalTo("userId", userId);
      query.equalTo("reportedAt", undefined);
      const accumulatedCount = await query.first();

      if (accumulatedCount) {
        query = relation.query();
        query.equalTo("userId", userId);
        query.descending("reportedAt");
        const latestCount = await query.first();

        practiceCount.count = latestCount.get("count");
        practiceCount.reportedAt = latestCount.get("reportedAt");
        practiceCount.accumulatedCount = accumulatedCount.get("count");
      }
      classInfo.counts.push(practiceCount);

      const moduleId = practices[i].get("moduleId");
      var practiceSubmodules = await loadPracticeSubmodules(moduleId);
      classInfo.practiceSubmodules.push(practiceSubmodules);
    }
  }
};

const generateClassSnapshotJsonV2 = async function(parseClass) {
  logger.info(`generateClassSnapshotJsonV2 - classId: ${parseClass.id}`);

  const result = {};
  var query = parseClass.relation("students").query();
  result.studentCount = await query.count();

  const sessions = parseClass.relation("sessionsV2");
  query = sessions.query();
  result.sessionScheduled = await query.count();

  query = sessions.query();
  query.exists("scheduledAt");
  query.lessThanOrEqualTo("scheduledAt", new Date());
  result.sessionCompleted = await query.count();
  result.reportedAt = new Date();

  return result;
};

const generateSessionSnapshotJsonV2 = async function(parseSession) {
  logger.info(`generateSessionSnapshotJsonV2 - sessionId: ${parseSession.id}`);

  var query = new Parse.Query("UserSessionAttendance");
  query.equalTo("sessionId", parseSession.id);
  query.equalTo("attendance", true);
  const attendance = await query.count();

  const studyRecords = [];
  const content = parseSession.get("content");
  for (var i = 0; i < content.submodules.length; i++) {
    const submoduleId = content.submodules[i];
    const studyRecord = {};
    query = new Parse.Query("UserStudyRecord");
    query.equalTo("submoduleId", submoduleId);
    query.equalTo("lineage", true);
    studyRecord.lineage = await query.count();

    query = new Parse.Query("UserStudyRecord");
    query.equalTo("submoduleId", submoduleId);
    query.equalTo("textbook", true);
    studyRecord.textbook = await query.count();

    studyRecords.push(studyRecord);
  }

  return { attendance, studyRecords, reportedAt: new Date() };
};

const generatePracticeSnapshotJsonV2 = async function(parsePractice) {
  logger.info(
    `generatePracticeSnapshotJsonV2 - practiceId: ${parsePractice.id}`
  );

  const relation = parsePractice.relation("counts");
  const query = relation.query();
  query.equalTo("reportedAt", undefined);
  const counts = await query.limit(MAX_QUERY_COUNT).find();

  var accumulatedCount = 0;
  for (var i = 0; i < counts.length; i++) {
    accumulatedCount += counts[i].get("count");
  }
  logger.info(
    `generatePracticeSnapshotJsonV2 - accumulatedCount: ${accumulatedCount}`
  );
  return { accumulatedCount, reportedAt: new Date() };
};

const loadSnapshotV2 = async function(parseObject, generateSnapshotJson) {
  const objectId = parseObject.id;
  logger.info(`loadSnapshotV2 - objectId: ${objectId}`);

  var query = new Parse.Query("Snapshot");
  query.equalTo("forObjectId", objectId);
  var snapshot = await query.first();

  var needToRegenerate = true;

  if (!snapshot) {
    snapshot = new Parse.Object("Snapshot");
    snapshot.set("forObjectId", objectId);
  } else {
    const today = new Date();
    //refresh every 1/2 hour
    needToRegenerate =
      today.getTime() > snapshot.updatedAt.getTime() + (1 * 60 * 60 * 1000) / 2;
  }

  if (needToRegenerate) {
    const value = await generateSnapshotJson(parseObject);
    snapshot.set("value", value);
    snapshot = await snapshot.save(null, MASTER_KEY);
  }

  return snapshot.get("value");
};

const loadPracticeSnapshotsV2 = async function(practices) {
  logger.info(`loadPracticeSnapshots - practices: ${practices}`);

  var result = [];
  if (practices && practices.length > 0) {
    for (var i = 0; i < practices.length; i++) {
      const practiceCount = await loadSnapshotV2(
        practices[i],
        generatePracticeSnapshotJsonV2
      );
      result.push(practiceCount);
    }
  }

  return result;
};

const loadUserStudyRecord = async function(userId, submoduleId) {
  logger.info(
    `loadUserStudyRecord - userId: ${userId} submoduleId: ${submoduleId}`
  );

  var result = {};
  query = new Parse.Query("UserStudyRecord");
  query.equalTo("userId", userId);
  query.equalTo("submoduleId", submoduleId);
  var record = await query.first();

  if (record) {
    result.lineage = record.get("lineage");
    result.textbook = record.get("textbook");
  }
  return result;
};

const loadClassSessionDetails = async function(
  userId,
  classInfo,
  classSession,
  forStudent
) {
  if (classSession) {
    classInfo.classSessions.push(classSession);
    var attendance;
    if (forStudent) {
      attendance = await loadStudentAttendanceV2(userId, classSession);
    } else {
      attendance = await loadSnapshotV2(
        classSession,
        generateSessionSnapshotJsonV2
      );
    }
    logger.info(
      `loadSessionDetails - attendance: ${JSON.stringify(attendance)}`
    );

    const submodules = [];
    const content = classSession.get("content");
    for (var i = 0; i < content.submodules.length; i++) {
      const submoduleId = content.submodules[i];
      const submodule = {};
      query = new Parse.Query("Submodule");
      query.equalTo("objectId", submoduleId);
      const parseSubmodule = await query.first();

      if (parseSubmodule) {
        submodule.id = submoduleId;
        submodule.index = parseSubmodule.get("index");
        submodule.name = parseSubmodule.get("name");
        submodule.url = parseSubmodule.get("url");
        submodule.moduleId = parseSubmodule.get("moduleId");
        submodule.studyRecord = forStudent
          ? await loadUserStudyRecord(userId, submoduleId)
          : attendance.studyRecords[i];
        submodules.push(submodule);
      }
    }
    logger.info(
      `loadSessionDetails - submodules: ${JSON.stringify(submodules)}`
    );

    classInfo.sessionDetails.push({ attendance, submodules });
  }
};

const loadUserRoles = async function(parseUser) {
  var userRoleQuery = new Parse.Query(Parse.Role);
  userRoleQuery.equalTo("users", parseUser);
  const roles = await userRoleQuery.find(MASTER_KEY);
  return roles.length > 0 ? roles.map(r => r.get("name")) : ["StudentUser"];
};

const loadClassTeachers = async function(parseClass) {
  const teachers = [];
  var query = parseClass.relation("classAdminUsers").query();
  var classAdminUsers = await query.find();
  for (var i = 0; i < classAdminUsers.length; i++) {
    const parseUser = classAdminUsers[i];
    const roles = await loadUserRoles(parseUser);

    if (roles.includes("TeacherUser")) {
      teachers.push(parseUser.get("name"));
    }
  }

  return teachers;
};

const loadDashboardV2 = async function(parseUser, forStudent) {
  const userId = parseUser ? parseUser._getId() : undefined;
  const dashboard = forStudent
    ? {
        enrolledClasses: [],
        newClasses: []
      }
    : {
        classes: []
      };

  var query = new Parse.Query("Class");

  //undefined if loading System Admin Dashboard
  if (parseUser) {
    if (forStudent) {
      query.equalTo("students", parseUser);
    } else {
      query.equalTo("classAdminUsers", parseUser);
    }
  }

  var parseClasses = await query.find();
  const enrolledClassList = [];

  for (var i = 0; i < parseClasses.length; i++) {
    const parseClass = parseClasses[i];
    const classInfo = {
      id: parseClass._getId(),
      name: parseClass.get("name"),
      url: parseClass.get("url"),
      classSessions: [],
      sessionDetails: [],
      practices: [],
      counts: [],
      practiceSubmodules: []
    };
    enrolledClassList.push(parseClass._getId());

    classInfo.teachers = await loadClassTeachers(parseClass);

    query = parseClass.relation("sessionsV2").query();
    var d = new Date();
    query.greaterThan("scheduledAt", d);
    query.ascending("scheduledAt");
    const nextSession = await query.first();
    await loadClassSessionDetails(userId, classInfo, nextSession, forStudent);

    query = parseClass.relation("sessionsV2").query();
    query.lessThanOrEqualTo("scheduledAt", d);
    query.descending("scheduledAt");
    const lastSession = await query.first();
    await loadClassSessionDetails(userId, classInfo, lastSession, forStudent);

    query = parseClass.relation("practices").query();
    query.ascending("index");
    classInfo.practices = await query.find();

    if (forStudent) {
      await loadStudentPracticeDetailsV2(
        userId,
        classInfo,
        classInfo.practices
      );
    } else {
      classInfo.counts = await loadPracticeSnapshotsV2(classInfo.practices);
      classInfo.classSnapshot = await loadSnapshotV2(
        parseClass,
        generateClassSnapshotJsonV2
      );
    }

    if (forStudent) {
      dashboard.enrolledClasses.push(classInfo);
    } else {
      dashboard.classes.push(classInfo);
    }
  }

  if (forStudent) {
    query = new Parse.Query("Class");
    query.equalTo("openForApplication", true);
    query.notContainedIn("objectId", enrolledClassList);
    parseClasses = await query.find();

    for (i = 0; i < parseClasses.length; i++) {
      const parseClass = parseClasses[i];
      const classInfo = {
        id: parseClass.id,
        name: parseClass.get("name"),
        url: parseClass.get("url")
      };

      classInfo.teachers = await loadClassTeachers(parseClass);
      dashboard.newClasses.push(classInfo);
    }
  }

  return dashboard;
};

Parse.Cloud.define(
  "home:loadDashboardsV2",
  async ({ user, params: { user: userWithRoles } }) => {
    requireAuth(user);

    const result = {};
    if (userWithRoles.roles.includes("StudentUser")) {
      result.studentDashboard = await loadDashboardV2(user, true);
    }

    if (userWithRoles.roles.includes("ClassAdminUser")) {
      result.classAdminDashboard = await loadDashboardV2(user, false);
    }

    if (userWithRoles.roles.includes("B4aAdminUser")) {
      result.systemAdminDashboard = await loadDashboardV2();
    }

    return result;
  }
);

Parse.Cloud.define(
  "home:updateAttendanceV2",
  async ({ user, params: { sessionId, attendance } }) => {
    requireAuth(user);

    const result = {};
    var query = new Parse.Query("UserSessionAttendance");
    query.equalTo("userId", user.id);
    query.equalTo("sessionId", sessionId);
    var sessionAttendance = await query.first();

    if (!sessionAttendance) {
      sessionAttendance = new Parse.Object("UserSessionAttendance");
      sessionAttendance.set("userId", user.id);
      sessionAttendance.set("sessionId", sessionId);
    }

    sessionAttendance.set("attendance", attendance.attendance);
    sessionAttendance.set("onLeave", attendance.onLeave);

    sessionAttendance = await sessionAttendance.save(null, MASTER_KEY);

    result.attendance = sessionAttendance.get("attendance");
    result.onLeave = sessionAttendance.get("onLeave");

    return result;
  }
);

Parse.Cloud.define(
  "home:reportPracticeCountV2",
  async ({
    user,
    params: { practiceId, practiceSubmoduleId, reportedAt, count }
  }) => {
    requireAuth(user);

    userId = user.id;
    logger.info(
      `home:reportPracticeCountV2 - userId: ${userId} practiceId: ${practiceId} practiceSubmoduleId: ${practiceSubmoduleId} reportedAt: ${reportedAt} count: ${count}`
    );

    var query = new Parse.Query("Practice");
    query.equalTo("objectId", practiceId);
    const practice = await query.first();
    const relation = practice.relation("counts");
    var newCount = false;
    var delta = count;

    query = relation.query();
    query.equalTo("userId", userId);
    query.equalTo("submoduleId", practiceSubmoduleId);
    query.equalTo("reportedAt", reportedAt);
    var currentPracticeCount = await query.first();

    if (!currentPracticeCount) {
      currentPracticeCount = new Parse.Object("UserPracticeCount");
      currentPracticeCount.set("userId", userId);
      currentPracticeCount.set("reportedAt", reportedAt);
      currentPracticeCount.set("submoduleId", practiceSubmoduleId);
      newCount = true;
    } else {
      delta -= currentPracticeCount.get("count");
    }

    currentPracticeCount.set("count", count);
    currentPracticeCount = await currentPracticeCount.save(null, MASTER_KEY);

    query = relation.query();
    query.equalTo("userId", userId);
    query.equalTo("reportedAt", undefined);
    var accumulatedCount = await query.first();

    if (accumulatedCount) {
      count = accumulatedCount.get("count") + delta;
    } else {
      accumulatedCount = new Parse.Object("UserPracticeCount");
      accumulatedCount.set("userId", userId);
      accumulatedCount.set("reportedAt", undefined);
      newCount = true;
    }

    accumulatedCount.set("count", count);
    accumulatedCount = await accumulatedCount.save(null, MASTER_KEY);

    if (newCount) {
      relation.add(currentPracticeCount);
      relation.add(accumulatedCount);
      await practice.save(null, MASTER_KEY);
    }

    return {
      id: currentPracticeCount._getId(),
      count: currentPracticeCount.get("count"),
      reportedAt: currentPracticeCount.get("reportedAt"),
      accumulatedCount: accumulatedCount.get("count")
    };
  }
);

Parse.Cloud.define(
  "class:fetchPracticeCountsV2",
  async ({ user, params: { practiceId, forAdmin } }) => {
    requireAuth(user);

    userId = user.id;
    logger.info(
      `home:fetchPracticeCountsV2 - userId: ${userId} practiceId: ${practiceId} forAdmin: ${forAdmin}`
    );

    var query = new Parse.Query("Practice");
    query.equalTo("objectId", practiceId);
    const practice = await query.first();
    const result = {
      forAdmin: forAdmin,
      practice: practice,
      counts: [],
      users: [],
      practiceSubmodules: []
    };
    var relation = practice.relation("counts");

    query = relation.query();
    if (forAdmin) {
      query.equalTo("reportedAt", undefined);
    } else {
      query.equalTo("userId", userId);
      query.descending("reportedAt");
    }
    result.counts = await query.limit(MAX_QUERY_COUNT).find();

    if (forAdmin) {
      for (var i = 0; i < result.counts.length; i++) {
        var userQuery = new Parse.Query(Parse.User);
        userQuery.equalTo("objectId", result.counts[i].get("userId"));
        const user = await userQuery.first();
        result.users.push(user.get("name"));
      }
    } else {
      const moduleId = practice.get("moduleId");
      result.practiceSubmodules = await loadPracticeSubmodules(moduleId);
    }

    return result;
  }
);

const loadNewSessions = async function(parseClass, classInfo) {
  var submoduleIds = [];
  for (var i = 0; i < classInfo.sessionDetails.length; i++) {
    for (var j = 0; j < classInfo.sessionDetails[i].submodules.length; j++) {
      submoduleIds.push(classInfo.sessionDetails[i].submodules[j].id);
    }
  }

  classInfo.modules = [];
  var query = parseClass.relation("modules").query();
  query.ascending("index");
  const modules = await query.limit(MAX_QUERY_COUNT).find();

  for (i = 0; i < modules.length; i++) {
    query = new Parse.Query("Submodule");
    query.equalTo("moduleId", modules[i].id);
    query.notContainedIn("objectId", submoduleIds);
    query.ascending("index");
    const parseSubmodules = await query.limit(MAX_QUERY_COUNT).find();

    classInfo.modules.push({
      id: modules[i].id,
      name: modules[i].get("name"),
      newSubmodules: parseSubmodules.map(e => {
        return {
          id: e.id,
          index: e.get("index"),
          name: e.get("name"),
          url: e.get("url"),
          moduleId: e.get("moduleId")
        };
      })
    });
  }
};

Parse.Cloud.define(
  "class:fetchSessionsV2",
  async ({
    user,
    params: { classId, forApplication, forAdmin, loadingNewSessions }
  }) => {
    requireAuth(user);

    var query = new Parse.Query("Class");
    query.equalTo("objectId", classId);
    const parseClass = await query.first();

    const classInfo = {
      id: parseClass._getId(),
      name: parseClass.get("name"),
      url: parseClass.get("url"),
      singleSubmodule: parseClass.get("singleSubmodule"),
      forApplication: forApplication,
      forAdmin: forAdmin,
      classSessions: [],
      sessionDetails: []
    };

    query = parseClass.relation("sessionsV2").query();
    query.descending("scheduledAt");
    const classSessions = await query.limit(MAX_QUERY_COUNT).find();

    for (var i = 0; i < classSessions.length; i++) {
      await loadClassSessionDetails(
        user.id,
        classInfo,
        classSessions[i],
        !forAdmin
      );
    }

    if (loadingNewSessions) {
      await loadNewSessions(parseClass, classInfo);
    }

    return classInfo;
  }
);

Parse.Cloud.define(
  "class:updateClassSessionV2",
  async ({ user, params: { session } }) => {
    requireAuth(user);

    logger.info(
      `updateClassSessionV2 - userId: ${user.id} session: ${JSON.stringify(
        session
      )}`
    );

    var classSession;
    var newSession;

    if (session.id) {
      var query = new Parse.Query("ClassSessionV2");
      query.equalTo("objectId", session.id);
      classSession = await query.first();
    } else {
      classSession = new Parse.Object("ClassSessionV2");
      newSession = true;
    }

    classSession.set("scheduledAt", session.scheduledAt);
    classSession.set("name", session.name);
    classSession.set("description", session.description);

    const submodules = session.submodules.map(e => e.id);
    classSession.set("content", { submodules, materials: session.materials });

    classSession = await classSession.save(null, MASTER_KEY);
    const result = { classSessionId: classSession.id };

    if (newSession) {
      query = new Parse.Query("Class");
      query.equalTo("objectId", session.classId);
      const parseClass = await query.first();
      result.classId = parseClass.id;

      const sessions = parseClass.relation("sessionsV2");
      sessions.add(classSession);
      await parseClass.save(null, MASTER_KEY);
    }

    return result;
  }
);
