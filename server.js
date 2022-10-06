const http = require('http');
const fs = require('fs');

/* ============================ SERVER DATA ============================ */
let artists = JSON.parse(fs.readFileSync('./seeds/artists.json'));
let albums = JSON.parse(fs.readFileSync('./seeds/albums.json'));
let songs = JSON.parse(fs.readFileSync('./seeds/songs.json'));

let nextArtistId = 2;
let nextAlbumId = 2;
let nextSongId = 2;

// returns an artistId for a new artist
function getNewArtistId() {
  const newArtistId = nextArtistId;
  nextArtistId++;
  return newArtistId;
}

// returns an albumId for a new album
function getNewAlbumId() {
  const newAlbumId = nextAlbumId;
  nextAlbumId++;
  return newAlbumId;
}

// returns an songId for a new song
function getNewSongId() {
  const newSongId = nextSongId;
  nextSongId++;
  return newSongId;
}

/* ======================= PROCESS SERVER REQUESTS ======================= */
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // assemble the request body
  let reqBody = "";
  req.on("data", (data) => {
    reqBody += data;
  });

  req.on("end", () => { // finished assembling the entire request body
    // Parsing the body of the request depending on the "Content-Type" header
    if (reqBody) {
      switch (req.headers['content-type']) {
        case "application/json":
          req.body = JSON.parse(reqBody);
          break;
        case "application/x-www-form-urlencoded":
          req.body = reqBody
            .split("&")
            .map((keyValuePair) => keyValuePair.split("="))
            .map(([key, value]) => [key, value.replace(/\+/g, " ")])
            .map(([key, value]) => [key, decodeURIComponent(value)])
            .reduce((acc, [key, value]) => {
              acc[key] = value;
              return acc;
            }, {});
          break;
        default:
          break;
      }
      console.log(req.body);
    }
    /* ========================== ROUTE HANDLERS ========================== */
    res.setHeader("Content-Type", "application/json");

    // GET /artists
    if (req.method === "GET" && req.url === "/artists") {
      res.statusCode = 200;
      return res.end(JSON.stringify(artists));
    };

    // 1) GET - /artists/:artistId
    if (req.method === "GET" && req.url.startsWith("/artists")) {
      if (req.url.split("/").length === 3) {
        const artistId = req.url.split("/")[2];

        req.statusCode = 200;
        return res.end(JSON.stringify(artists[artistId]));
      }
    }

    // 2) POST - /artists
    if (req.method === "POST" && req.url === "/artists") {
      const newArtist = {
        artistId: getNewArtistId(),
        ...req.body
      };
      artists[newArtist.artistId] = newArtist;

      res.statusCode = 201;
      return res.end(JSON.stringify(artists));
    }

    // 3) PUT or PATCH - /artists/:artistId
    if (req.method === "PUT" || req.method === "PATCH" && req.url.startsWith("/artists") && req.url.split("/").length === 3) {
      const artistId = req.url.split("/")[2];
      for (const [key, value] of Object.entries(req.body)) {
        artists[artistId][key] = value;
      }
      res.statusCode = 200;
      return res.end(JSON.stringify(artists[artistId]));
    }

    // 4) DELETE - /artists/:artistId
    if (req.method === "DELETE" && req.url.startsWith("/artists") && req.url.split("/").length === 3) {
      const artistId = req.url.split("/")[2];
      artists[artistId] = undefined;

      res.statusCode = 200;
      return res.end(JSON.stringify({ "message": "Successfully deleted" }))
    }

    // 5) GET - /artists/:artistId/albums
    if (req.method === "GET" && req.url.startsWith("/artists")) {
      const urlParts = req.url.split("/");
      if (urlParts.length === 4 && urlParts[3] === "albums") {
        const artistId = urlParts[2];
        let albumList = {};
        for (const album in albums) {
          if (albums[album].artistId == artistId) {
            albumList[album] = albums[album];
          }
        }
        res.statusCode = 200;
        return res.end(JSON.stringify(albumList));
      }
    }

    // 6) GET - /albums/:albumId
    if (req.method === "GET" && req.url.startsWith("/albums") && req.url.split("/").length === 3) {
      const albumId = req.url.split("/")[2];
      res.statusCode = 200;
      return res.end(JSON.stringify(albums[albumId]));
    }

    // 7) POST - /artists/:artistId/albums
    if (req.method === "POST" && req.url.startsWith("/artists") && req.url.split("/").length === 4) {
      const artistId = req.url.split("/")[2];
      const album = {
        albumId: getNewAlbumId(),
        ...req.body,
        artistId: artistId
      };
      albums[album.albumId] = album;
      let albumList = {};
      for (const album in albums) {
        if (albums[album].artistId == artistId) {
          albumList[album] = albums[album];
        }
      }
      res.statusCode = 201;
      return res.end(JSON.stringify(albumList));
    }

    // 8) PUT - or PATCH /albums/:albumId
    if (req.method === "PUT" || req.method === "PATCH" && req.url.startsWith("/albums") && req.url.split("/").length === 3) {
      const albumId = req.url.split("/")[2];
      for (const [key, value] of Object.entries(req.body)) {
        albums[albumId][key] = value;
      }
      res.statusCode = 200;
      return res.end(JSON.stringify(albums[albumId]));
    }

    // 9) DELETE - /albums/:albumId
    if (req.method === "DELETE" && req.url.startsWith("/albums") && req.url.split("/").length === 3) {
      const albumId = req.url.split("/")[2];
      albums[albumId] = undefined;

      res.statusCode = 200;
      return res.end(JSON.stringify({ "message": "Successfully deleted" }))
    }

    // 10) GET - /artists/:artistId/songs
    if (req.method === "GET" && req.url.startsWith("/artists")) {
      const urlParts = req.url.split("/");
      if (urlParts.length === 4 && urlParts[3] === "songs") {
        const artistId = urlParts[2];
        let songsList = {};
        for (const song in songs) {
          let albumId = songs[song].albumId;
          if (albums[albumId].artistId == artistId) {
            songsList[song] = songs[song];
          }
        }
        res.statusCode = 200;
        return res.end(JSON.stringify(songsList));
      }
    }

    // 11) GET - /albums/:albumId/songs
    if (req.method === "GET" && req.url.startsWith("/albums")) {
      const urlParts = req.url.split("/");
      if (urlParts.length === 4 && urlParts[3] === "songs") {
        const albumId = urlParts[2];
        let songsList = {};
        for (const song in songs) {
          if (songs[song].albumId == albumId) {
            songsList[song] = songs[song];
          }
        }
        res.statusCode = 200;
        return res.end(JSON.stringify(songsList));
      }
    }

    // 12) GET - /trackNumbers/:trackNumber/songs
    if (req.method === "GET" && req.url.startsWith("/trackNumber")) {
      const urlParts = req.url.split("/");
      if (urlParts.length === 4 && urlParts[3] === "songs") {
        const trackNumber = urlParts[2];
        let songsList = {};
        for (const song in songs) {
          if (songs[song].trackNumber == trackNumber) {
            songsList[song] = songs[song];
          }
        }
        res.statusCode = 200;
        return res.end(JSON.stringify(songsList));
      }
    }

    // 13) GET - /songs/:songId
    if (req.method === "GET" && req.url.startsWith("/songs") && req.url.split("/").length === 3) {
      const songId = req.url.split("/")[2];

      res.statusCode = 200;
      return res.end(JSON.stringify(songs[songId]))
    }

    // 14) POST - /albums/:albumId/songs
    if (req.method === "POST" && req.url.startsWith("/albums") && req.url.split("/").length === 4) {
      const albumId = req.url.split("/")[2];
      const song = {
        songId: getNewSongId(),
        ...req.body,
        albumId: albumId
      };
      songs[song.songId] = song;
      let songsList = {};
      for (const song in songs) {
        if (songs[song].albumId == albumId) {
          songsList[song] = songs[song];
        }
      }
      res.statusCode = 201;
      return res.end(JSON.stringify(songsList));
    }

    // 15) PUT or PATCH - /songs/:songId
    if (req.method === "PUT" || req.method === "PATCH" && req.url.startsWith("/songs") && req.url.split("/").length === 3) {
      const songId = req.url.split("/")[2];
      for (const [key, value] of Object.entries(req.body)) {
        songs[songId][key] = value;
      }
      res.statusCode = 200;
      return res.end(JSON.stringify(songs[songId]));
    }

    // 16) DELETE - /songs/:songId
    if (req.method === "DELETE" && req.url.startsWith("/songs") && req.url.split("/").length === 3) {
      const songId = req.url.split("/")[2];
      songs[songId] = undefined;

      res.statusCode = 200;
      return res.end(JSON.stringify({ "message": "Successfully deleted" }))
    }

    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.write("Endpoint not found");
    return res.end();
  });
});

const port = 5000;

server.listen(port, () => console.log('Server is listening on port', port));