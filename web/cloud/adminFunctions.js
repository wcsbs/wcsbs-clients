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

Parse.Cloud.define(
  "admin:upgradeClassSessionToV2",
  async ({ user, params: { user: userWithRoles } }) => {
    requireAuth(user);
    requireRole(userWithRoles, "B4aAdminUser");

    var query = new Parse.Query("ClassSession");
    query.descending("scheduledAt");
    var allSessions = await query.limit(MAX_QUERY_COUNT).find();
    var allV2Sessions = [];
    for (var i = 0; i < allSessions.length; i++) {
      const session = allSessions[i];
      if (!session.get("scheduledAt")) {
        break;
      }

      var sessionV2 = new Parse.Object("ClassSessionV2");
      sessionV2.set("name", session.get("name"));
      sessionV2.set("description", session.get("description"));
      sessionV2.set("scheduledAt", session.get("scheduledAt"));

      query = new Parse.Query("Submodule");
      const url = session.get("url");
      query.equalTo("url", url);
      var submodule = await query.first();

      const content = { submodules: [] };
      if (submodule) {
        content.submodules.push(submodule.id);

        if (url.includes("dymqx")) {
          const description = session.get("description");

          if (description && description.length > 0) {
            const match = description.match(/(\d+)/);
            if (match) {
              const index = parseInt(match[0]);
              query = new Parse.Query("Submodule");
              query.equalTo("index", index);
              query.equalTo("moduleId", submodule.get("moduleId"));
              submodule = await query.first();
              content.submodules.push(submodule.id);
              logger.info(
                `upgradeClassSessionToV2 - content: ${JSON.stringify(content)}`
              );
            }
          }
        }
      }
      sessionV2.set("content", content);

      sessionV2 = await sessionV2.save(null, MASTER_KEY);

      allV2Sessions.push(sessionV2);
    }

    return { count: allV2Sessions.length };
  }
);

Parse.Cloud.define(
  "admin:updateClassSessionV2",
  async ({ user, params: { user: userWithRoles } }) => {
    requireAuth(user);
    requireRole(userWithRoles, "B4aAdminUser");

    var query = new Parse.Query("ClassSessionV2");
    query.descending("scheduledAt");
    var allSessions = await query.limit(MAX_QUERY_COUNT).find();
    var updatedSessions = [];

    for (var i = 0; i < allSessions.length; i++) {
      const session = allSessions[i];
      var content = session.get("content");
      if (content.submodules.length == 1) {
        continue;
      }

      const description = session.get("description");
      if (description && description.length > 0) {
        const match = description.match(/(\d+)/);
        if (match) {
          const index = parseInt(match[0]);
          query = new Parse.Query("Submodule");
          query.equalTo("index", index);
          query.equalTo("moduleId", "ZwfTADbqUK");
          submodule = await query.first();
          content.submodules[1] = submodule.id;
        }
        session.set("content", content);

        const sessionV2 = await session.save(null, MASTER_KEY);
        updatedSessions.push(sessionV2);
      }
    }

    return { count: updatedSessions.length, allV2Sessions: updatedSessions };
  }
);
