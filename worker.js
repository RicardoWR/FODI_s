const EXPOSE_PATH = "";
const ONEDRIVE_REFRESHTOKEN = "待输入"
const PASSWD_FILENAME = ".password";
const clientId = "待输入";
const clientSecret = "待输入";
const loginHost = "https://login.microsoftonline.com";
const apiHost = "https://graph.microsoft.com";
const redirectUri = "http://localhost/onedrive-login";

async function handleRequest(request) {
  let querySplited, requestPath;
  let queryString = decodeURIComponent(request.url.split("?")[1]);
  if (queryString) querySplited = queryString.split("=");
  if (querySplited && querySplited[0] === "file") {
    const file = querySplited[1];
    const fileName = file.split("/").pop(); //文件位置，默认根目录
    if (fileName === PASSWD_FILENAME)
      return Response.redirect(
        "https://www.baidu.com/s?wd=%E6%80%8E%E6%A0%B7%E7%9B%97%E5%8F%96%E5%AF%86%E7%A0%81",
        301
      );
    requestPath = file.replace("/" + fileName, "");
    const url = await fetchFiles(requestPath, fileName);
    return Response.redirect(url, 302);
  } else {
    const { headers } = request;
    const contentType = headers.get("content-type");
    let body = {};
    if (contentType && contentType.includes("form")) {
      const formData = await request.formData();
      for (let entry of formData.entries()) {
        body[entry[0]] = entry[1];
      }
    }
    requestPath = Object.getOwnPropertyNames(body).length ? body["?path"] : "";
    const files = await fetchFiles(requestPath, null, body.passwd);
    return new Response(files, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "max-age=3600",
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  }
}

addEventListener("fetch", (event) => {
  try {
    return event.respondWith(handleRequest(event.request));
  } catch (e) {
    return event.respondWith(new Response("Error thrown " + e.message));
  }
});

const OAUTH = {
  redirectUri: redirectUri,
  refreshToken: ONEDRIVE_REFRESHTOKEN,
  clientId: clientId,
  clientSecret: clientSecret,
  oauthUrl: loginHost + "/common/oauth2/v2.0/",
  apiUrl: apiHost + "/v1.0/me/drive/root",
  scope: apiHost + "/Files.ReadWrite.All offline_access",
};

async function gatherResponse(response) {
  const { headers } = response;
  const contentType = headers.get("content-type");
  if (contentType.includes("application/json")) {
    return await response.json();
  } else if (contentType.includes("application/text")) {
    return await response.text();
  } else if (contentType.includes("text/html")) {
    return await response.text();
  } else {
    return await response.text();
  }
}

async function cacheFetch(url, options) {
  return fetch(new Request(url, options), {
    cf: {
      cacheTtl: 3600,
      cacheEverything: true,
    },
  });
}

async function getContent(url) {
  const response = await cacheFetch(url);
  const result = await gatherResponse(response);
  return result;
}

async function getContentWithHeaders(url, headers) {
  const response = await cacheFetch(url, { headers: headers });
  const result = await gatherResponse(response);
  return result;
}

async function fetchFormData(url, data) {
  const formdata = new FormData();
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      formdata.append(key, data[key]);
    }
  }
  const requestOptions = {
    method: "POST",
    body: formdata,
  };
  const response = await cacheFetch(url, requestOptions);
  const result = await gatherResponse(response);
  return result;
}

async function fetchAccessToken() {
  url = OAUTH["oauthUrl"] + "token";
  data = {
    client_id: OAUTH["clientId"],
    client_secret: OAUTH["clientSecret"],
    grant_type: "refresh_token",
    requested_token_use: "on_behalf_of",
    refresh_token: OAUTH["refreshToken"],
  };
  const result = await fetchFormData(url, data);
  return result.access_token;
}

async function fetchFiles(path, fileName, passwd) {
  if (path === "/") path = "";
  if (path || EXPOSE_PATH) path = ":" + EXPOSE_PATH + path;

  const accessToken = await fetchAccessToken();
  const uri =
    OAUTH.apiUrl +
    encodeURI(path) +
    "?expand=children(select=name,size,parentReference,lastModifiedDateTime,@microsoft.graph.downloadUrl)";
  const body = await getContentWithHeaders(uri, {
    Authorization: "Bearer " + accessToken,
  });
  if (fileName) {
    let thisFile = null;
    body.children.forEach((file) => {
      if (file.name === decodeURIComponent(fileName)) {
        thisFile = file["@microsoft.graph.downloadUrl"];
        return;
      }
    });
    return thisFile;
  } else {
    let files = [];
    let encrypted = false;
    for (let i = 0; i < body.children.length; i++) {
      const file = body.children[i];
      if (file.name === PASSWD_FILENAME) {
        const PASSWD = await getContent(file["@microsoft.graph.downloadUrl"]);
        if (PASSWD !== passwd) {
          encrypted = true;
          break;
        } else {
          continue;
        }
      }
      files.push({
        name: file.name,
        size: file.size,
        time: file.lastModifiedDateTime,
        url: file["@microsoft.graph.downloadUrl"],
      });
    }
    let parent = body.children.length
      ? body.children[0].parentReference.path
      : body.parentReference.path;
    parent = parent.split(":").pop().replace(EXPOSE_PATH, "") || "/";
    parent = decodeURIComponent(parent);
    if (encrypted) {
      return JSON.stringify({ parent: parent, files: [], encrypted: true });
    } else {
      return JSON.stringify({ parent: parent, files: files });
    }
  }
}
