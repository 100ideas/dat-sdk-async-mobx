import React from "react";
import { decorate, observable, action, computed, runInAction, flow, toJS, configure } from "mobx";
import { useObserver } from "mobx-react";

// const SDK = require("./override/dat-sdk-promise");
import SDK from "./override/dat-sdk-promise";
const { DatArchive } = SDK();

configure({ enforceActions: 'always' });

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
  // key = '';
  // archive = false;
  // _info = "not loaded";
  // fs = {};
  // files = {};
  // loaded = false;
  // key
  // archive
  // _info
  // fs
  // files
  // loaded

  // async firstRead() {
  //   runInAction(async () => {
  //     this.files["/dat.json"] = await this.archive.readFile("/dat.json");
  //     this.loaded = true;
  //   });
  //   runInAction(async () => {
  //     this.fs["/"] = await this.archive.readdir("/");
  //   });
  // }

  // https://mobx.js.org/best/actions.html#flows
  initArchive = flow(function*(discoveryKey) {
    // action('setDiscoveryKey', () => this.key = discoveryKey)
    this.key = discoveryKey
    this.archive = {}
    this.loaded = false
    this.ready = false

    this.fs = {}
    this.files = {}

    try {
      // const _archive = yield DatArchive.load(discoveryKey); // yield instead of await
      this.archive = yield DatArchive.load(discoveryKey); // yield instead of await
      // this.loaded = yield this.archive._archive.ready
      // console.log(this.archive)
      // action('initArchive', () => this.archive = _archive)
    
      this.addListeners();
      // const rootdl = yield this.archive.download('/')

      // this.fs['/'] = yield this.archive.readdir("/")
      // console.log(`this.fs['/']`, toJS(this.fs['/']))
      // console.log('root dl', rootdl)
      
      // console.log("\n\n\n", rootdir, "\n\n\n")
      // this.files["/dat.json"] = yield this.archive.readFile("/dat.json");
    } catch (error) {
      const msg = "error: initArchive() " + error.toString()
      console.log(msg)
    }
    // this.loaded = true;
  })

  constructor(discoveryKey = datFoundationKey) {
    // action('setDiscoveryKey', () => this.key = discoveryKey)
    // this.key = discoveryKey
    // action('init', this.initArchive(discoveryKey));
    this.initArchive(discoveryKey)
  }

  addListeners() {
    // let evts = archive.watch(['**/*.txt', '**/*.md'])
    let evts = this.archive.watch();
    // evts.addEventListener("invalidated", ({ path }) => {
    //   console.log(path, "has been invalidated, downloading the update");
    //   // this.archive.download(path);
    // });
    evts.addEventListener("ready", async () => {
      console.log("archive is READY!");
      // this.read(path);
    });
    // evts.addEventListener("changed", async ({ path }) => {
    //   console.log(path, "has been updated!");
    //   this.read(path);
    // });
    // this.archive.addEventListener("network-changed", x => {
    //   console.log(x && x, "current peers");
    // });
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

  updateInfo() {
    runInAction(async () => {
      this._info = await this.archive.getInfo();
    });
  }

  get archiveInfo() {
    if (this.loaded) {
      // this.updateInfo()
    }
    return this._info
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
      console.log(`\tread(${path}):`, err.toString(), stat);
      return stat;
    }
    console.log("read() stat", stat);
    if (stat.isFile()) {
      console.log("read() stat: isFile()==true", path);
      // this.fs["/dat.json"] = await this.archive.readFile("/dat.json", "utf8");
      if (path in this.files) {
        console.log("found path in this.files", path);
        this.fetchFile(path);
        return this.files[path];
      }
      this.fetchFile(path);
      return "fetching file " + path;
    }
    if (stat.isDirectory()) {
      console.log("read() stat: isDirectory()==true", path);
      this.fs[path] = await this.archive.readdir(path, { stat: true });
    }
  }

  async fetchFile(path) {
    let res = await this.archive.readFile(path);
    console.log("tried to get", path, "result:", res);
    runInAction( () => this.files[path] = res);
    return res;
  }

}
decorate(mobxArchive, {
  key: observable,
  archive: observable,
  _info: observable,
  files: observable,
  fs: observable,
  loaded: observable,
  state: observable,

  lsroot: computed,
  archiveInfo: computed,
  filesByNameArray: computed,

  initArchive: action,
  read: action,
  fetchFile: action,
  firstRead: action,
  updateInfo: action
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
