import React from "react";
import {
  decorate,
  observable,
  action,
  computed,
  runInAction,
  toJS
} from "mobx";
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
      runInAction(async () => {
        this.fs = await this.archive.readFile("/dat.json");
        // this.fs["/"] = await this.archive.readdir("/");
        // this.files["/dat.json"] = await this.archive.readFile("/dat.json");
        // await this.firstRead();
        this.loaded = true;
      });
      // this.archive = await getDefaultDat();
    });
  }

  get lsroot() {
    return this.fs["/"] && this.fs["/"].toString();
  }

  get archiveInfo() {
    runInAction(async () => {
      this._info = await this.archive.getInfo();
    });
    return this._info;
  }

  get filesAsJson() {
    // let stat = { stat: JSON.stringify(this.fs, null, 2)}
    let stat = [];
    stat = Object.keys(this.files).map(fn => {
      // stat[fn] =
      // stat.push([fn, this.files[fn].toString()]);
      return [fn, this.files[fn].toString()];
    });
    return stat;
  }

  read(path) {
    console.log("trying to get " + path);
    // this.fs["/dat.json"] = await this.archive.readFile("/dat.json", "utf8");
    if (path in this.files) {
      console.log(path);
      return this.files[path];
    }
    this.fetchFile(path);
    return "fetching...";
  }

  async fetchFile(path) {
    let res = await this.archive.readFile(path);
    console.log("tried to get ", res, "result:");
    console.log(res);
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
  filesAsJson: computed,

  read: action,
  fetchFile: action,
  firstRead: action
});

const archive = new mobxArchive();
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
        <pre className="readfile">{JSON.stringify(archive.files, null, 2)}</pre>
        {console.log(archive.files)}
      </div>
      {/* <h3>archive.read():</h3> <pre>{JSON.stringify(archive.fs, null, 2)}</pre> */}
      {/* <pre>archiveInfo: {JSON.stringify(archive.archiveInfo, null, 2)}</pre> */}
    </div>
  ));
};
