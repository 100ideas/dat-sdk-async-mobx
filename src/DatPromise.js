import React from "react";
import { decorate, observable, action, computed, reaction, runInAction, flow, toJS, configure } from "mobx";
import { observer, useObserver } from "mobx-react";

// const SDK = require("dat-sdk/promise");
import SDK from "./override/dat-sdk-promise";

configure({ enforceActions: 'always' });

// https://datbase.org/view?query=60c525b5589a5099aa3610a8ee550dcd454c3e118f7ac93b7d41b6b850272330
const datFoundationKey =
  "dat://60c525b5589a5099aa3610a8ee550dcd454c3e118f7ac93b7d41b6b850272330";
const DATPROJECT_KEY = 'dat://60c525b5589a5099aa3610a8ee550dcd454c3e118f7ac93b7d41b6b850272330'
const DATPROJECT_URL = 'dat://dat.foundation'
const TEST_TIMEOUT = 10 * 1000

const datConfig = {
  storageOpts: {
    storageLocation: '/'
  },
  live: true
}

const isBrowser = process.title === 'browser'
console.warn('isBrowser:', isBrowser)


const { DatArchive } = SDK(datConfig);

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
    this.syncs = 0

    this.fs = {}
    this.files = {}

    try {
      // const _archive = yield DatArchive.load(discoveryKey); // yield instead of await
      // this.archive = yield DatArchive.load(discoveryKey); // yield instead of await
      // this.archive = yield new DatArchive(discoveryKey); 
      this.archive = yield DatArchive.load(DATPROJECT_KEY); 
      // this.archive = yield DatArchive.fork(discoveryKey); 
      // this.loaded = yield this.archive._archive.ready
      // action('initArchive', () => this.archive = _archive)
    
      this.addListeners();
      // const rootdl = yield this.archive.download('/')

      this.fs['/'] = yield this.archive.readdir("/")
      // console.log(`this.fs['/']`, toJS(this.fs['/']))
      // console.log('root dl', rootdl)
      
      // console.log("\n\n\n", rootdir, "\n\n\n")
      this.files["/dat.json"] = yield this.archive.readFile("/dat.json");
      // const datJson = this.archive.readFile('/dat.json', 'utf8')
      // this.files['/dat.json'] = datJson
    } catch (error) {
      const msg = "error: initArchive() " + error.toString()
      console.log(msg)
    }
    this.loaded = true;
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
    this.archive.addEventListener("sync", ({ feed }) => {
      runInAction(async () => this.syncs++)
      console.log("Downloaded everything currently published in the", feed);
    });
  }

  watchSyncs = reaction(
    () => this.syncs,
    syncnum => { console.log("saw a sync event! ", syncnum, this.fs['/']); this.fetchRootFiles()},
    {delay: 500}
  )

  get lsroot() {
    return this.fs["/"] && this.fs["/"].toString();
  }

  updateInfo() {
    runInAction(async () => {
      // this._info = await this.archive.getInfo();
      this._info = {"note": "this.archive.getInfo() disabled"};
    });
  }

  get archiveInfo() {
    if (this.loaded) {
      // this.updateInfo()
    }
    return {...this._info, syncs: this.syncs }
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
      // this.fs[path] = await this.archive.readdir(path, { stat: true });
      const newDirs = await this.archive.readdir(path)
      runInAction( () => this.fs[path] = newDirs);
      this.fetchDirFiles(path)
    }
  }

  async fetchFile(path) {
    let res = await this.archive.readFile(path);
    console.log("tried to get", path, "result:", res);
    runInAction( () => this.files[path] = res);
    return res;
  }

  // get fsToJs(){
  //   return '/' in this.fs ? (this.fs['/']) : []
  // }

  async fetchRootFiles() {
    // if(toJS(this.fs["/"]) !== 'array') {
      if(this.fs["/"] && this.fs["/"].length) {
      console.log('fetchRootFiles()', this.fs["/"])
      this.fs["/"].map( name => {
        this.read(name)
      })
    }
  }

  async fetchDirFiles(dir) {
    // if(toJS(this.fs["/"]) !== 'array') {
      if(this.fs[dir] && this.fs[dir].length) {
      console.log('fetchDirFiles()', this.fs[dir])
      this.fs[dir].map( name => {
        // this.read(dir +'/'+ name)    // WORKS but is causing dat-node-sdk to timeout
        this.archive.download(dir +'/'+ name)
      })
    }
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
  syncs: observable,

  lsroot: computed,
  archiveInfo: computed,
  filesByNameArray: computed,
  // fsToJS: computed,

  initArchive: action,
  read: action,
  fetchFile: action,
  fetchRootFiles: action,
  fetchDirFiles: action, 
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
