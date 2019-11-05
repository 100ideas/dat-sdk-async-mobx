import React from "react";
import { decorate, observable, action, computed, runInAction } from "mobx";
import { useObserver } from "mobx-react";

const SDK = require("./override/dat-sdk-promise");
const { DatArchive } = SDK();

// https://datbase.org/view?query=60c525b5589a5099aa3610a8ee550dcd454c3e118f7ac93b7d41b6b850272330
const datFoundationKey =
  "dat://60c525b5589a5099aa3610a8ee550dcd454c3e118f7ac93b7d41b6b850272330";

// async function getDefaultDat() {
//   // const archive = await Hyperdrive.load("dat://dat.foundation");
//   const archive = await DatArchive.load(datFoundationKey);
//   // const archive = await DatArchive.load("dat://dat.foundation");
//   const someData = await archive.readFile("/dat.json", "utf8");
//   console.log("Dat foundation dat.json:", someData);
//   return someData;
// }

class mobxArchive {
  key = datFoundationKey;
  archive = false;
  _info = "not loaded";
  fs = {};
  files = {};
  loaded = false;

  constructor(discoveryKey = datFoundationKey) {
    this.key = discoveryKey;
    runInAction(async () => {
      this.archive = await DatArchive.load(this.key);
      //   runInAction(async () => {
      //     this.fs = await this.archive.readFile("/dat.json");
      //   });

      this.addListeners();

      runInAction(async () => {
        // this.fs = await this.archive.readFile("/dat.json");
        this.files["/dat.json"] = await this.archive.readFile("/dat.json");
        this.fs["/"] = await this.archive.readdir("/", { stat: true });

        // await this.firstRead();
        this.loaded = true;
      });
      // this.archive = await getDefaultDat();
    });
  }

  addListeners() {
    // let evts = archive.watch(['**/*.txt', '**/*.md'])
    let evts = this.archive.watch();
    // evts.addEventListener("invalidated", ({ path }) => {
    //   console.log(path, "has been invalidated, downloading the update");
    //   // this.archive.download(path);
    // });
    evts.addEventListener("changed", async ({ path }) => {
      console.log(path, "has been updated!");
      this.read(path);
    });
    this.archive.addEventListener("network-changed", x => {
      console.log(x && x, "current peers");
    });
    // this.archive.addEventListener("download", ({ feed, block, bytes }) => {
    //   console.log("Downloaded a block in the", feed, { block, bytes });
    // });
    // this.archive.addEventListener("upload", ({ feed, block, bytes }) => {
    //   console.log("Uploaded a block in the", feed, { block, bytes });
    // });
    // this.archive.addEventListener("sync", ({ feed }) => {
    //   console.log("Downloaded everything currently published in the", feed);
    // });
  }

  get lsroot() {
    return this.fs["/"] && this.fs["/"].toString();
  }

  get archiveInfo() {
    if (this.loaded) {
      runInAction(async () => {
        this._info = await this.archive.getInfo();
      });
    }
  }

  get filesByNameArray() {
    // let stat = { stat: JSON.stringify(this.fs, null, 2)}
    // let stat = [];
    // stat = Object.keys(this.files).map(fn => [fn, this.files[fn].toString()]);
    // return stat.length === 0 ? [["missing", "undefined"]] : stat;
    // return stat.length === 0 ? [] : stat;
    return Object.keys(this.files).map(fn => [fn, this.files[fn].toString()]);
  }

  async read(path) {
    console.log("trying to get " + path);
    let stat = false;
    try {
      stat = await this.archive.stat(path);
    } catch (err) {
      console.warn(`read(${path}):`, err, stat);
      return stat;
    }
    console.log("read() stat", stat);
    if (stat.isFile()) {
      console.log("read() stat: isFile()==true", path);
      // this.fs["/dat.json"] = await this.archive.readFile("/dat.json", "utf8");
      if (path in this.files) {
        return this.files[path];
      }
      this.fetchFile(path);
      return "fetching file " + path;
    }
    if (stat.isDirectory()) {
      console.log("read() stat: isDirectory()==true", path);
      this.fs[path] = await this.archive.readdir("/", { stat: true });
    }
  }

  async fetchFile(path) {
    let res = await this.archive.readFile(path);
    console.log("tried to get", path, "result:", res);
    this.files[path] = res;
    return res;
  }

  async firstRead() {
    runInAction(async () => {
      this.files["/dat.json"] = await this.archive.readFile("/dat.json");
      this.loaded = true;
    });
    runInAction(async () => {
      this.fs["/"] = await this.archive.readdir("/");
    });
  }
}
decorate(mobxArchive, {
  key: observable,
  archive: observable,
  _info: observable,
  files: observable,
  fs: observable,
  loaded: observable,

  lsroot: computed,
  archiveInfo: computed,
  filesByNameArray: computed,

  read: action,
  fetchFile: action,
  firstRead: action
});

const archive = new mobxArchive();
document.arc = archive;
// archive.read();

export const DatComponent = () => {
  // const archive = await Hyperdrive.load("dat://dat.foundation");

  return useObserver(() => (
    <div>
      <h2 className="dat-header">
        {`DatArchive.load('dat://dat.foundation')`}
        <small className={archive.loaded ? "" : "loading"}>
          {archive.loaded ? "loaded!" : "...loading..."}
        </small>
      </h2>
      <h3>archive.fs:</h3> <pre>{JSON.stringify(archive.fs, null, 2)}</pre>
      <div>
        <h3>archive.files:</h3>
        {/* <pre className="readfile">{JSON.stringify(archive.files, null, 2)}</pre> */}
        {archive.filesByNameArray.length > 0 ? (
          <ul>
            {/* {archive.filesAsJson.map( ({[name, content], idx}) => <li key={idx}> */}
            {archive.filesByNameArray.map(([name, content], idx) => (
              <li key={idx}>
                <h4>{name}</h4>
                <pre>{content}</pre>
              </li>
            ))}
          </ul>
        ) : (
          ""
        )}
      </div>
      {/* <h3>archive.read():</h3> <pre>{JSON.stringify(archive.fs, null, 2)}</pre> */}
      <pre>archiveInfo: {JSON.stringify(archive.archiveInfo, null, 2)}</pre>
    </div>
  ));
};
