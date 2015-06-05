// <reference path="../../includes.ts"/>
module Forge {

  export var context = '/forge';
  export var hash = '#' + context;
  export var defaultRoute = hash + '/projects';
  export var pluginName = 'Forge';
  export var pluginPath = 'plugins/forge/';
  export var templatePath = pluginPath + 'html/';
  export var log:Logging.Logger = Logger.get(pluginName);

  export var defaultIconUrl = Core.url("/img/forge.svg");

  export var gogsServiceName = "gogs";
  export var orionServiceName = "orion";

  export function isForge(workspace) {
    return true;
  }

  export function commandLink(name, resourcePath) {
    if (name) {
      if (resourcePath) {
        return UrlHelpers.join("/forge/command", name, resourcePath);
      } else {
        return UrlHelpers.join("/forge/command/", name);
      }
    }
    return null;
  }

  export function commandsLink(resourcePath) {
    if (resourcePath) {
      return UrlHelpers.join("/forge/commands/user", resourcePath);
    } else {
      return "/forge/commands";
    }
  }

  export function reposApiUrl(ForgeApiURL) {
    return UrlHelpers.join(ForgeApiURL, "/repos");
  }

  export function repoApiUrl(ForgeApiURL, path) {
    return UrlHelpers.join(ForgeApiURL, "/repos/user", path);
  }

  export function commandApiUrl(ForgeApiURL, commandId, resourcePath = null) {
    return UrlHelpers.join(ForgeApiURL, "command", commandId, resourcePath);
  }

  export function executeCommandApiUrl(ForgeApiURL, commandId) {
    return UrlHelpers.join(ForgeApiURL, "command", "execute", commandId);
  }

  export function validateCommandApiUrl(ForgeApiURL, commandId) {
    return UrlHelpers.join(ForgeApiURL, "command", "validate", commandId);
  }

  export function commandInputApiUrl(ForgeApiURL, commandId, resourcePath) {
    return UrlHelpers.join(ForgeApiURL, "commandInput", commandId, resourcePath);
  }



  /**
   * Returns the project for the given resource path
   */
  function modelProject(ForgeModel, resourcePath) {
    if (resourcePath) {
      var project = ForgeModel.projects[resourcePath];
      if (!project) {
        project = {};
        ForgeModel.projects[resourcePath] = project;
      }
      return project;
    } else {
      return ForgeModel.rootProject;
    }
  }

  export function setModelCommands(ForgeModel, resourcePath, commands) {
    var project = modelProject(ForgeModel, resourcePath);
    project.$commands = commands;
  }

  export function getModelCommands(ForgeModel, resourcePath) {
    var project = modelProject(ForgeModel, resourcePath);
    return project.$commands || [];
  }

  function modelCommandInputMap(ForgeModel, resourcePath) {
    var project = modelProject(ForgeModel, resourcePath);
    var commandInputs = project.$commandInputs;
    if (!commandInputs) {
      commandInputs = {};
      project.$commandInputs = commandInputs;
    }
    return commandInputs;
  }

  export function getModelCommandInputs(ForgeModel, resourcePath, id) {
    var commandInputs = modelCommandInputMap(ForgeModel, resourcePath);
    return commandInputs[id];
  }

  export function setModelCommandInputs(ForgeModel, resourcePath, id, item) {
    var commandInputs = modelCommandInputMap(ForgeModel, resourcePath);
    return commandInputs[id] = item;
  }

  export function enrichRepo(repo) {
    var owner = repo.owner || {};
    var user = owner.username || repo.user;
    var name = repo.name;
    var avatar_url = owner.avatar_url;
    if (avatar_url && avatar_url.startsWith("http//")) {
      avatar_url = "http://" + avatar_url.substring(6);
      owner.avatar_url = avatar_url;
    }
    if (user && name) {
      var resourcePath = user + "/" + name;
      repo.$commandsLink = commandsLink(resourcePath);
      repo.$buildsLink = "/kubernetes/builds?q=/" + resourcePath + ".git";
      var injector = HawtioCore.injector;
      if (injector) {
        var ServiceRegistry = injector.get("ServiceRegistry");
        if (ServiceRegistry) {
          var orionLink = ServiceRegistry.serviceLink(orionServiceName);
          var gogsService = ServiceRegistry.findService(gogsServiceName);
          if (orionLink && gogsService) {
            var portalIp = gogsService.portalIP;
            if (portalIp) {
              var port = gogsService.port;
              var portText = (port && port !== 80 && port !== 443) ? ":" + port : "";
              var protocol = (port && port === 443) ? "https://" : "http://";
              var gitCloneUrl = UrlHelpers.join(protocol + portalIp + portText + "/", resourcePath + ".git");

              repo.$openProjectLink = UrlHelpers.join(orionLink,
                "/git/git-repository.html#,createProject.name=" + name + ",cloneGit=" + gitCloneUrl);
            }
          }
        }
      }
    }
  }

  export function createHttpConfig() {
    var authHeader = localStorage["gogsAuthorization"];
    var email = localStorage["gogsEmail"];
    var config = {
/*
      headers: {
        Authorization: authHeader,
        Email: email
      }
*/
    };
    return config;
  }

  function addQueryArgument(url, name, value) {
    if (url && name && value) {
      var sep =  (url.indexOf("?") >= 0) ? "&" : "?";
      return url + sep +  name + "=" + encodeURIComponent(value);
    }
    return url;
  }

  export function createHttpUrl(url, authHeader = null, email = null) {
    authHeader = authHeader || localStorage["gogsAuthorization"];
    email = email || localStorage["gogsEmail"];

    url = addQueryArgument(url, "_gogsAuth", authHeader);
    url = addQueryArgument(url, "_gogsEmail", email);
    return url;
  }

  export function commandMatchesText(command, filterText) {
    if (filterText) {
      return Core.matchFilterIgnoreCase(angular.toJson(command), filterText);
    } else {
      return true;
    }
  }

  export function isLoggedIntoGogs() {
    var authHeader = localStorage["gogsAuthorization"];
    return authHeader ? true : false;
/*
    var config = createHttpConfig();
    return config.headers.Authorization ? true : false;
*/
  }

  export function redirectToGogsLoginIfRequired($location, loginPage = "/forge/repos") {
    if (!isLoggedIntoGogs()) {
      $location.path(loginPage)
    }
  }
}
