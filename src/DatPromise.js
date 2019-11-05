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

const MY_TINY_DAT_KEY = 'dat://7ef15d1489c933f7555174cf24aa1025a2add81d6308310f7acd6937aa49dc6a'

const datConfig = {
  storageOpts: {
    storageLocation: '/'
  },
  // live: true, // stream duplexify error w/ DATPROJECT_KEY
  eagerUpdate: true,
  sparse: false,
  download: true,
  timeout: 30 * 1000
}

const isBrowser = process.title === 'browser'
console.warn('isBrowser:', isBrowser)


const { DatArchive } = SDK(datConfig);

class mobxArchive {

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
      this.archive = yield DatArchive.load(discoveryKey); 
      this.addListeners();
      this.fs['/'] = yield this.archive.readdir("/")
    } catch (error) {
      const msg = `error: initArchive() (possibly 'this.archive.readdir("/")') ${error.toString()}`
      console.log(msg)
    }
    try {
      this.files["/dat.json"] = yield this.archive.readFile("/dat.json");
    } catch (error) {
      const msg = `error: initArchive() ('archive.readFile("/dat.json")') ${error.toString()}`
      console.log(msg)
    }
    this.loaded = true;
    this._info = yield this.archive.getInfo()
  })

  constructor(discoveryKey = datFoundationKey) {
    this.initArchive(discoveryKey)
  }

  addListeners() {
    let evts = this.archive.watch();
    // evts.addEventListener("invalidated", ({ path }) => {
    //   console.log(path, "has been invalidated, downloading the update");
    //   // this.archive.download(path);
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
    // TODO 
    //   create reaction like syncs to track + debounce file changes, add toast notifications
    // evts.addEventListener("changed", async ({ path }) => {
    //   console.log(path, "has been updated!");
    //   this.read(path);
    // });    
  }

  watchSyncs = reaction(
    () => this.syncs,
    syncnum => { 
      let msg = "saw a sync event! " + syncnum;  // access syncnum here so mobx will react to it changing
      this.fetchRootFiles()
      this.updateInfo()
    },
    {delay: 500}
  )

  get lsroot() {
    return this.fs["/"] && this.fs["/"].toString();
  }

  async updateInfo() {
    console.log("updateinfo", this.archive)
    let newInfo = this.archive.getInfo ? await this.archive.getInfo() : {'archiveInfo': 'somethins messed up'};
    runInAction(async () => this._info = newInfo)
  }

  get archiveInfo() {
    return this.loaded 
      ? {...this._info, syncs: this.syncs }
      : { archiveInfo: "still loading..." }
  }

  get filesByNameArray() {
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
    if (stat.isFile()) {
      if (path in this.files) {
        this.fetchFile(path);
        return this.files[path];
      }
      this.fetchFile(path);
      return "fetching file " + path;
    }
    if (stat.isDirectory()) {
      const newDirs = await this.archive.readdir(path)
      runInAction( () => this.fs[path] = newDirs);
      this.fetchDirFiles(path)
    }
  }

  async fetchFile(path) {
    let res = await this.archive.readFile(path);
    runInAction( () => this.files[path] = res);
    return res;
  }

  async fetchRootFiles() {
      if(this.fs["/"] && this.fs["/"].length) {
      this.fs["/"].map( name => {
        this.read(name)
      })
    }
  }

  async fetchDirFiles(dir) {
      if(this.fs[dir] && this.fs[dir].length) {
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

const archive = new mobxArchive(MY_TINY_DAT_KEY);
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
      <pre>archiveInfo: {JSON.stringify(archive.archiveInfo, null, 2)}</pre>
    </div>
  ));
};
