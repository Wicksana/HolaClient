const fetch = require("node-fetch");

module.exports.load = async function (app, db) {
  app.post("/api/purge", async (req, res) => {
    if (!req.session.pterodactyl) return res.redirect("/auth");
    try {
      const response = await fetch(`${settings.pterodactyl.domain}/api/application/servers`, {
        headers: {
          Authorization: `Bearer ${settings.pterodactyl.key}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to get server list: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const servers = data.data;
      const inactiveServers = servers.filter(
        (server) => !server.attributes.name.includes(settings.features.purge.keyword)
      );

      for (const server of inactiveServers) {
        try {
          const serverId = server.attributes.id;
          const serverName = server.attributes.name;
          const deleteResponse = await fetch(`${settings.pterodactyl.domain}/api/application/servers/${serverId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${settings.pterodactyl.key}`,
              "Content-Type": "application/json",
            },
          });

          if (deleteResponse.ok) {
            console.log(`Server ${serverName} deleted successfully.`);
          } else {
            console.error(
              `Failed to delete server ${serverName}: ${deleteResponse.status} ${deleteResponse.statusText}`
            );
          }
        } catch (error) {
          console.error(
            `Failed to delete server ${server.attributes.name}: ${error}`
          );
        }
      }

      console.log("All servers purged successfully");
      res.sendStatus(200);
    } catch (error) {
      console.error(`Failed to get server list: ${error.message}`);
      res.sendStatus(500);
    }
  });
};
