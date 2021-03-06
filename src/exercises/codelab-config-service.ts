import {CodelabConfig, AppConfig} from "../app/codelab-config";
import {FileConfig} from "../app/file-config";
import {differ} from "../app/differ/differ";
import {ExerciseService} from "../app/exercise.service";
import {Injectable} from "@angular/core";

const test = window.location.hash.includes('test');
const presentationMode = window.location.hash.includes('present');
const debug = test || window.location.hash.includes('debug');
const reset = window.location.hash.includes('reset') || debug;

export const appConfig: AppConfig = {
  name: 'Codelab',
  page: 'milestone',
  user: '',
  auth: '',
  feedbackEnabled: false,
  preserveState: !reset,
  debug,
  test,
  presentationMode
};

@Injectable()
export class CodelabConfigService {
  public config: CodelabConfig;

  constructor(public exerciseService: ExerciseService) {
    function testFile(filename = 'Test.ts', code?) {
      return {
        filename,
        moduleName: filename.replace('ts', ''),
        type: 'ts',
        excludeFromTesting: false,
        test: true,
        bootstrap: true,
        before: 'mochaBefore();',
        after: 'mochaAfter();',
        hidden: true,
        code
      };
    }

    function hidden(...files: FileConfig[]): FileConfig[] {
      return files.map(file => Object.assign({}, file, {hidden: true}))
    }

    function readOnly(...files: FileConfig[]): FileConfig[] {
      return files.map(file => Object.assign({}, file, {readonly: true}))
    }

    function justForReference(...files: FileConfig[]): FileConfig[] {
      return collapsed(...readOnly(...files));
    }

    function collapsed(...files: FileConfig[]): FileConfig[] {
      return files.map(file => Object.assign({}, file, {collapsed: true}))
    }


    function evaled(file) {
      return Object.assign(file, {
        after: `
    export function evalJs( js ){
      return eval(js);
    }
`
      });
    }


    function mapObject(object, callback) {
      return Object.keys(object).reduce((result, key) => {
        result[key] = callback(object[key]);
        return result;
      }, {});
    }

    function newHtmlFile(name, code) {
      return {
        filename: name + '.html',
        moduleName: name,
        code,
        type: 'html'
      }
    }

    function newTsFile(name, code) {
      const bootstrap = name.toLowerCase().indexOf('main') >= 0;
      return {
        bootstrap: bootstrap,
        excludeFromTesting: bootstrap,
        filename: name + '.ts',
        moduleName: name,
        code,
        type: 'ts'
      }
    }

    function loadHtml(name, states) {
      const result = differ(exerciseService.getExercise(`ng2ts/${name}.html`), states);
      return mapObject(result, (code) => newHtmlFile(name, code)) as Versions;
    }

    function loadTs(name, states) {
      const result = differ(exerciseService.getExercise(`ng2ts/${name}.ts`), states);

      return mapObject(result, (code) => newTsFile(name, code)) as Versions;
    }

    const commits = [
      'codelab',
      'codelabSolved',
      'createComponent',
      'createComponentSolved',
      'createModule',
      'createModuleSolved',
      'bootstrap',
      'bootstrapSolved',
      'templatePageSetup',
      'templatePageSetupSolved',
      'templateAddAction',
      'templateAddActionSolved',
      'templateAllVideos',
      'templateAllVideosSolved',
      'diInjectService',
      'diInjectServiceSolved',
      'dataBinding',
      'dataBindingSolved',
      'videoComponentCreate',
      'videoComponentCreateSolved',
      'videoComponentUse',
      'videoComponentUseSolved',
      'thumbsComponentCreate',
      'thumbsComponentCreateSolved',
      'thumbsComponentUse',
      'thumbsComponentUseSolved',
      'togglePanelComponentCreate',
      'togglePanelComponentCreateSolved',
      'togglePanelComponentUse',
      'togglePanelComponentUseSolved',
      'contextComponentUse',
      'contextComponentUseSolved',
      'fuzzyPipeCreate',
      'fuzzyPipeCreateSolved',
      'fuzzyPipeUse',
      'fuzzyPipeUseSolved',
      'neverShow'
    ];
    interface Versions {
      codelab: FileConfig,
      codelabSolved: FileConfig,
      createComponent: FileConfig,
      createComponentSolved: FileConfig,
      createModule: FileConfig,
      createModuleSolved: FileConfig,
      bootstrap: FileConfig,
      bootstrapSolved: FileConfig,
      templatePageSetup: FileConfig,
      templatePageSetupSolved: FileConfig,
      templateAddAction: FileConfig,
      templateAddActionSolved: FileConfig,
      templateAllVideos: FileConfig,
      templateAllVideosSolved: FileConfig,
      diInjectService: FileConfig,
      diInjectServiceSolved: FileConfig,
      dataBinding: FileConfig,
      dataBindingSolved: FileConfig,
      videoComponentCreate: FileConfig,
      videoComponentCreateSolved: FileConfig,
      videoComponentUse: FileConfig,
      videoComponentUseSolved: FileConfig,
      thumbsComponentCreate: FileConfig,
      thumbsComponentCreateSolved: FileConfig,
      thumbsComponentUse: FileConfig,
      thumbsComponentUseSolved: FileConfig,
      togglePanelComponentCreate: FileConfig,
      togglePanelComponentCreateSolved: FileConfig,
      togglePanelComponentUse: FileConfig,
      togglePanelComponentUseSolved: FileConfig,
      contextComponentUse: FileConfig,
      contextComponentUseSolved: FileConfig,
      fuzzyPipeCreate: FileConfig,
      fuzzyPipeCreateSolved: FileConfig
      fuzzyPipeUse: FileConfig,
      fuzzyPipeUseSolved: FileConfig,
    }

    const files = {
      test: loadTs('app.component', commits),
      appComponent: loadTs('app.component', commits),
      appModule: loadTs('app.module', commits),
      appHtml: loadHtml('app', commits),
      bootstrap: loadTs('main', commits),
      //dataBinding: loadTs('data-binding/DataBinding', commits),
      videoItem: loadTs('video/video-item', commits),
      api: loadTs('api.service', commits),
      videoService: loadTs('video/video.service', commits),
      videoHtml: loadHtml('video/video', commits),
      videoComponent: loadTs('video/video.component', commits),
      thumbsComponent: loadTs('thumbs/thumbs.component', commits),
      thumbsHtml: loadHtml('thumbs/thumbs', commits),
      togglePanelHtml: loadHtml('toggle-panel/toggle-panel', commits),
      togglePanelComponent: loadTs('toggle-panel/toggle-panel.component', commits),
      wrapperComponent: loadTs('wrapper.component', commits),
      contextComponent: loadTs('context/context.component', commits),
      contextService: loadTs('context/context.service', commits),
      codelab: loadTs('typescript-intro/Codelab', commits),
      mainCodelab: loadTs('typescript-intro/Main', commits),
      guest: loadTs('typescript-intro/Guest', commits),
      fuzzyPipe: loadTs('fuzzy-pipe/fuzzy.pipe', commits),
    };

    // Too hard to use diff comments for this, so I'm replacing the whole file
    files.appModule.thumbsComponentCreate = newTsFile('app.module', exerciseService.getExercise(`ng2ts/thumbs.app.module.ts`));
    files.appModule.togglePanelComponentCreate = newTsFile('app.module', exerciseService.getExercise(`ng2ts/toggle-panel.app.module.ts`));
    files.test.codelab = testFile('typescript-intro/Test', exerciseService.getExercise(`ng2ts/tests/codelabTest.ts`));
    files.test.createComponent = testFile('createComponent/Test', exerciseService.getExercise(`ng2ts/tests/createComponentTest.ts`));
    files.test.createModule = testFile('createModule/Test', exerciseService.getExercise(`ng2ts/tests/createModuleTest.ts`));
    files.test.bootstrap = testFile('bootstrap/Test', exerciseService.getExercise(`ng2ts/tests/bootstrapTest.ts`));
    files.test.templatePageSetup = testFile('templatePageSetup/Test', exerciseService.getExercise(`ng2ts/tests/templatePageSetupTest.ts`));
    files.test.templateAddAction = testFile('templateAddAction/Test', exerciseService.getExercise(`ng2ts/tests/templateAddActionTest.ts`));
    files.test.templateAllVideos = testFile('templateAllVideos/Test', exerciseService.getExercise(`ng2ts/tests/templateAllVideosTest.ts`));
    files.test.diInjectService = testFile('diInjectService/Test', exerciseService.getExercise(`ng2ts/tests/diInjectServiceTest.ts`));
    files.test.videoComponentCreate = testFile('videoComponentCreate/Test', exerciseService.getExercise(`ng2ts/tests/videoComponentCreateTest.ts`));
    files.test.videoComponentUse = testFile('videoComponentUse/Test', exerciseService.getExercise(`ng2ts/tests/videoComponentUseTest.ts`));
    files.test.thumbsComponentCreate = testFile('thumbs/ThumbsComponentCreateTest', exerciseService.getExercise(`ng2ts/tests/ThumbsComponentCreateTest.ts`));
    files.test.thumbsComponentUse = testFile('thumbs/ThumbsComponentUseTest', exerciseService.getExercise(`ng2ts/tests/ThumbsComponentUseTest.ts`));
    files.test.togglePanelComponentCreate = testFile('togglePanelComponentCreate/Test', exerciseService.getExercise(`ng2ts/tests/togglePanelComponentCreateTest.ts`));
    files.test.togglePanelComponentUse = testFile('togglePanelComponentUse/Test', exerciseService.getExercise(`ng2ts/tests/togglePanelComponentUseTest.ts`));
    files.test.contextComponentUse = testFile('contextComponentUse/Test', exerciseService.getExercise(`ng2ts/tests/contextComponentUseTest.ts`));
    files.test.fuzzyPipeCreate = testFile('fuzzyPipeCreate/Test', exerciseService.getExercise(`ng2ts/tests/fuzzyPipeCreateTest.ts`));
    files.test.fuzzyPipeUse = testFile('fuzzyPipeUse/Test', exerciseService.getExercise(`ng2ts/tests/fuzzyPipeUseTest.ts`));

    this.config = {
      app: appConfig,
      runId: 0,
      autorun: true,
      name: 'Angular2 codelab',
      user: '',
      auth: {},
      page: 'milestone',
      selectedMilestoneIndex: 0,
      milestones: [
        {
          /**
           * See the interface.
           */
          name: 'Intro to TypeScript',
          selectedExerciseIndex: 0,
          exercises: [
            {
              name: 'Intro',
              description: `
          <h1>Welcome to the Angular and TypeScript CodeLab!</h1>
          <p>In this codelab we're going to learn the basics of TypeScript and Angular.</p>
          <p>We're using Angular version 2.1.0</p>
          <p>The slides for the codelab are available using
          <a href = "https://docs.google.com/presentation/d/1Wh4ZwTKG1h66f3mTD4GQO8rKwGDEJeBSvUDJ3udU1LA/edit?usp=sharing">here</a>.</p>                 
        `,
              fileTemplates: [],
              tests: [],
              messageNext: `Let's start`
            },
            {
              name: 'Typescript',
              description: `
          <p>We created a TypeScript file for you, now let's add our first TS class
           called Codelab.</p>
          
          <p>It will take a list of guests, and will have a 'getGuestsComing' method, which will only return people who're coming.</p> 
          <p>As you can see in the 'Main.ts' file we have 4 people signed up, but Charles Darwin had a last minute change of plans, 
          so only 3 people should be returned.</p>            
        `,
              solutions: [
                files.codelab.codelabSolved
              ],
              fileTemplates: [
                evaled(files.codelab.codelab),
                files.guest.codelab,
                files.mainCodelab.codelab,
                files.test.codelab
              ]
            }
          ]
        },
        {
          name: 'Bootstrapping your app',
          selectedExerciseIndex: 0,
          exercises: [
            {
              name: 'Intro',
              description: `
          <h1>Let's build our first Angular app!</h1>
          <p>This is how it will look:</p>

          <div class = "inBrowser">
            <div class="smaller">
              <h1>Hello CatTube!</h1>
            </div>
          </div>
          <p>3 simple steps: </p>
          <ol>
            <li>Create a Component</li>
            <li>Create a NgModule</li>
            <li>Bootstrap the NgModule</li>
          </ol>
        `,
              fileTemplates: [],
              tests: [],
              messageNext: `I'm a ready, let's start!`
            },
            {
              name: 'Create a component',
              description: `
            <p>Let's create our first component!</p>`,
              solutions: [
                files.appComponent.createComponentSolved
              ],
              fileTemplates: [
                evaled(files.appComponent.createComponent),
                ...hidden(
                  files.appModule.createModuleSolved,
                  files.bootstrap.bootstrapSolved
                ),
                files.test.createComponent
              ]
            }, {
              name: 'Create a NgModule',
              description: `Now we got the component, we need to pass it to a NgModule.`,
              solutions: [
                files.appModule.createModuleSolved
              ],
              fileTemplates: [
                files.appModule.createModule,
                ...justForReference(
                  files.appComponent.createModule
                ),
                ...hidden(
                  files.bootstrap.bootstrapSolved
                ),
                files.test.createModule
              ]
            },
            {
              name: 'Bootstrap the module',
              skipTests: true,
              description: `
          <p>Now we got both NgModule and component ready, let's bootstrap the app!</p>
          <p>There's no  simple way to test it,  make sure your app displays: 'Hello CatTube!'</p>`,
              solutions: [
                files.bootstrap.bootstrapSolved
              ],
              fileTemplates: [
                files.bootstrap.bootstrap,
                ...justForReference(
                  files.appComponent.bootstrap,
                  files.appModule.bootstrap
                ),
                files.test.bootstrap
              ]
            }
          ]
        },
        {
          name: 'Templates',
          selectedExerciseIndex: 0,
          exercises: [
            {
              name: 'Intro',
              description: `
          <h1>Let's explore Angular templates!</h1>
          <p>As a result we'll see our cats displayed.</p>
          
          <div class = "inBrowser">
            <div class="smaller">
              <my-app><div>
                <h1>CatTube</h1>              
                <button>Search!</button>
                <div>
                  <h2>Cute kitten</h2>
                  <img src="/assets/images/cat-0.png">
                </div><div>
                  <h2>Kitten on the tree</h2>
                  <img src="/assets/images/cat-1.jpg">
                </div><div>
                  <h2>Serouis cat</h2>
                  <img src="/assets/images/cat-2.jpg">
                </div>
              </div></my-app>
            </div>
          </div>
        
        `,
              fileTemplates: [],
              tests: [],
              messageNext: `I'm a ready, let's start!`
            },
            {
              name: 'Set up the page',
              description: `Let's setup a header, a search box, and a search button in the app component!`,
              solutions: [
                files.appHtml.templatePageSetupSolved
              ],
              fileTemplates: [
                files.appHtml.templatePageSetup,
                ...justForReference(
                  files.appComponent.templatePageSetup,
                  files.appModule.templatePageSetup,
                  files.bootstrap.templatePageSetup,
                ),
                files.test.templatePageSetup
              ],
              tests: []
            }, {
              name: 'Add some action',
              description: `Let's do two things here: 
              <ul>
              <li>Add a search method to the AppComponent</li>
              <li>Display a message when there are no videos.</li>`,
              solutions: [
                files.appHtml.templateAddActionSolved,
                files.appComponent.templateAddActionSolved,
              ],
              fileTemplates: [
                files.appComponent.templateAddAction,
                files.appHtml.templateAddAction,
                ...justForReference(
                  files.videoItem.templateAddAction,
                  files.appModule.templateAddAction,
                  files.bootstrap.templateAddAction,
                ),
                files.test.templateAddAction
              ],
              tests: []
            }, {
              name: 'Display all videos',
              description: `Finally let's iterate over the videos.`,
              solutions: [
                files.appComponent.templateAllVideosSolved,
                files.appHtml.templateAllVideosSolved,
              ],
              fileTemplates: [
                files.appComponent.templateAllVideos,
                files.appHtml.templateAllVideos,
                ...justForReference(
                  files.videoItem.templateAddAction,
                  files.appModule.templateAllVideos,
                  files.bootstrap.templateAllVideos,
                ),
                files.test.templateAllVideos
              ],
              tests: []
            }
          ]
        },
        {
          name: 'Dependency Injection',
          selectedExerciseIndex: 0,
          exercises: [{
            name: 'Intro',
            description: `
          <h1>Let's inject a service.</h1>
          <p>Using a service is way better than hardcoded data. As a result we get even more cats.</p>
          
          <div class = "inBrowser">
            <div class="smaller">
              <my-app><div>
                <h1>CatTube</h1>
                <input placeholder="video" type="text">
                <button>Search!</button>
                <div>
                  <h2>Cute kitten</h2>
                  <img  src="/assets/images/cat-0.png">
                </div><div>
                  <h2>Kitten on the tree</h2>
                  <img  src="/assets/images/cat-1.jpg">
                </div><div>
                  <h2>More kitten</h2>
                  <img  src="/assets/images/cat-2.jpg">
                </div><div>
                  <h2>Another kitten</h2>
                  <img  src="/assets/images/cat-3.jpg">
                </div><div>
                  <h2>Serouis cat</h2>
                  <img  src="/assets/images/cat-4.jpg">
                </div><div>
                  <h2>Serouis cat</h2>
                  <img  src="/assets/images/cat-5.jpg">
                </div><div>
                  <h2>Serouis cat</h2>
                  <img  src="/assets/images/cat-6.jpg">
                </div>
              </div></my-app>
            </div>
          </div>
        
        `,
            fileTemplates: [],
            tests: [],
            messageNext: `I'm a ready, let's start!`
          }, {
            name: 'Service injection',
            description: `
          Let's fetch the videos using a service, instead of having them hardcoded.
        `,
            solutions: [
              files.videoService.diInjectServiceSolved,
              files.appModule.diInjectServiceSolved,
              files.appComponent.diInjectServiceSolved,
            ],
            fileTemplates: [
              files.videoService.diInjectService,
              files.appModule.diInjectService,
              files.appComponent.diInjectService,
              ...justForReference(
                files.appHtml.diInjectService,
                files.videoItem.diInjectService,
                files.api.diInjectService,
                files.bootstrap.diInjectService,
              ),
              files.test.diInjectService
            ],
            tests: []
          }]
        },
        {
          name: 'Component Tree',
          selectedExerciseIndex: 0,
          exercises: [
            {
              name: 'Intro',
              description: `
          <h1>Let's create a Video component!</h1>
          <p>Create a separate component with the video information.</p>
          <p>Add description, amount of views and likes. </p>
              
            <div class = "inBrowser">
              <div class="smaller">   
                <div>
                  <h2>Cute kitten</h2>
                  <img  src="/assets/images/cat-0.png">
                  <div>Date 2016-11-25</div>
                  <div>Views 100</div>
                  <div>Likes 20</div>
                  <div>Description todo</div>
                </div>
              </div>
            </div>          
        `,
              fileTemplates: [],
              tests: [],
              messageNext: `I'm a ready, let's start!`
            },
            /*{

             name: 'Data binding',
             description: `<p>This is a bonus exercise, meant to illustrate passing the data from
             parent component to the child component </p>
             `,
             solutions: [
             files.dataBinding.dataBindingSolved,
             ],
             fileTemplates: [
             files.dataBinding.dataBinding,
             files.appModule.dataBinding,
             files.bootstrap.dataBinding,
             ...hidden({
             filename: 'index.html',
             moduleName: 'index',
             code: '<my-flag></my-flag>',
             type: 'html'
             })
             // testFile()
             ],
             tests: []
             }, */{

              name: 'Create VideoComponent',
              description: `Create a video component.`,
              solutions: [
                files.videoHtml.videoComponentCreateSolved,
                files.videoComponent.videoComponentCreateSolved,
              ],
              fileTemplates: [
                files.videoComponent.videoComponentCreate,
                files.videoHtml.videoComponentCreate,
                ...justForReference(
                  files.appModule.videoComponentCreate,
                  files.videoService.videoComponentCreate,
                  files.appHtml.videoComponentCreate,
                  files.appComponent.videoComponentCreate,
                  files.videoItem.videoComponentCreate,
                  files.api.videoComponentCreate,
                  files.bootstrap.videoComponentCreate,
                ),
                files.test.videoComponentCreate
              ],
              tests: []
            },
            {
              name: 'Use VideoComponent',
              description: `Use the VideoComponent in the app.`,
              solutions: [
                files.appModule.videoComponentUseSolved,
                files.appHtml.videoComponentUseSolved,
              ],
              fileTemplates: [
                files.appModule.videoComponentUse,
                files.appHtml.videoComponentUse,
                ...justForReference(
                  files.videoHtml.videoComponentUse,
                  files.videoComponent.videoComponentUse,
                  files.appComponent.videoComponentUse,
                  files.videoService.videoComponentUse,
                  files.videoItem.videoComponentUse,
                  files.api.videoComponentUse,
                  files.bootstrap.videoComponentUse
                ),
                files.test.videoComponentUse
              ],
              tests: []
            }]
        }, {
          name: 'Custom events',
          selectedExerciseIndex: 0,
          exercises: [
            {
              name: 'Intro',
              description: `
          <h1>Let's use custom events!</h1>
          <p>Add a ThumbsComponent which will emit an 'onThumbs' event.  </p>
          <p>In the video component listen to the event and change the amount of likes accordingly.</p>
              
            <div class = "inBrowser">
              <div class="smaller">   
                <div>
                  <h2>Cute kitten</h2>
                  <img  src="/assets/images/cat-0.png">
                  <div>Date 2016-11-25</div>
                  <div>Views 100</div>
                  <div>Likes 20</div>
                  <div>Description todo</div>
                  <button>Thumbs Up</button> <button>Thumbs Down</button>
                </div>
              </div>
            </div>          
        `,
              fileTemplates: [],
              tests: [],
              messageNext: `I'm a ready, let's start!`
            },
            {
              name: 'Create ThumbsComponent',
              description: `Create ThumbsComponent.`,
              solutions: [
                files.thumbsHtml.thumbsComponentCreateSolved,
                files.thumbsComponent.thumbsComponentCreateSolved,
              ],
              fileTemplates: [
                files.thumbsHtml.thumbsComponentCreate,
                files.thumbsComponent.thumbsComponentCreate,
                ...justForReference(
                  files.api.thumbsComponentCreate,
                  files.appModule.thumbsComponentCreate,
                  files.bootstrap.thumbsComponentCreate,
                ),
                files.test.thumbsComponentCreate,
                ...hidden({
                    filename: 'index.html',
                    moduleName: 'index',
                    code: '<my-thumbs></my-thumbs>',
                    type: 'html'
                  },
                )
              ],
              tests: []
            },
            {
              name: 'Use ThumbsComponent',
              description: `Use the 'ThumbsComponent' in the app.`,
              solutions: [
                files.appModule.thumbsComponentUseSolved,
                files.videoHtml.thumbsComponentUseSolved,
                files.videoComponent.thumbsComponentUseSolved
              ],
              fileTemplates: [
                files.videoHtml.thumbsComponentUse,
                files.videoComponent.thumbsComponentUse,
                files.appModule.thumbsComponentUse,
                ...justForReference(
                  files.thumbsHtml.thumbsComponentUse,
                  files.thumbsComponent.thumbsComponentUse,
                  files.appHtml.thumbsComponentUse,
                  files.appComponent.thumbsComponentUse,
                  files.videoService.thumbsComponentUse,
                  files.videoItem.thumbsComponentUse,
                  files.api.thumbsComponentUse,
                  files.bootstrap.thumbsComponentUse,
                ),
                files.test.thumbsComponentUse,
              ],
              tests: []
            }]
        }, {
          name: 'Content projection',
          selectedExerciseIndex: 0,
          exercises: [

            {
              name: 'Intro',
              description: `
          <h1>Let's project some content!</h1>
          <p>In this milestone we'll create a component called 'TogglePanel'</p>
          <p>It will actually take 2 divs, but only display one at a time. </p>
              
            <div class = "inBrowser">
              <div class="smaller">   
                <div>
                  <h2>Cute kitten</h2>
                  <img src="/assets/images/cat-0.png">            
                  <div>This is the description. Once you click 'show meta' button it will be gone.  (please don't try clicking it here, I'm just a screenshot)</div>
                  <div>[Show meta]</div>
                  <button>Thumbs Up</button> <button>Thumbs Down</button>
                </div>
              </div>
            </div>               
              
            <p>So when you click the 'Show meta button', description is gone, likes and views are displayed instead.</p>
              
            <div class = "inBrowser">
              <div class="smaller">   
                <div>
                  <h2>Cute kitten</h2>
                  <img  src="/assets/images/cat-0.png">            
                  <div>Likes: 1000</div>
                  <div>Views: 1000000</div>
                  <div>[Show description]</div>
                  <button>[Thumbs Up]</button> <button>[Thumbs Down]</button>
                </div>
              </div>
            </div>          
        `,
              fileTemplates: [],
              tests: [],
              messageNext: `I'm a ready, let's start!`
            },
            {
              name: 'Add TogglePanelComponent',
              description: `Let's create a component which will use content projection to toggle between description and meta information. `,
              solutions: [
                files.togglePanelHtml.togglePanelComponentCreateSolved,
                files.togglePanelComponent.togglePanelComponentCreateSolved,
              ],
              fileTemplates: [
                files.togglePanelComponent.togglePanelComponentCreate,
                files.togglePanelHtml.togglePanelComponentCreate,
                ...justForReference(
                  files.wrapperComponent.togglePanelComponentCreate,
                  files.appModule.togglePanelComponentCreate,
                  {
                    filename: 'index.html',
                    code: '<my-wrapper></my-wrapper>',
                    type: 'html',
                    moduleName: 'index'
                  },
                  files.bootstrap.togglePanelComponentCreate,
                ),
                files.test.togglePanelComponentCreate
              ],
              tests: []
            },
            {
              name: 'Use TogglePanelComponent',
              description: `Now let's use the component.`,
              solutions: [
                files.appModule.togglePanelComponentUseSolved,
                files.videoHtml.togglePanelComponentUseSolved
              ],
              fileTemplates: [
                files.appModule.togglePanelComponentUse,
                files.videoHtml.togglePanelComponentUse,
                ...justForReference(
                  files.videoComponent.togglePanelComponentUse,
                  files.togglePanelHtml.togglePanelComponentUse,
                  files.togglePanelComponent.togglePanelComponentUse,
                  files.appHtml.togglePanelComponentUse,
                  files.appComponent.togglePanelComponentUse,
                  files.videoService.togglePanelComponentUse,
                  files.videoItem.togglePanelComponentUse,
                  files.api.togglePanelComponentUse,
                  files.thumbsHtml.togglePanelComponentUse,
                  files.thumbsComponent.togglePanelComponentUse,
                  files.bootstrap.togglePanelComponentUse,
                ),
                files.test.togglePanelComponentUse
              ],
              tests: []
            }]
        },
        {
          name: 'Parent-container',
          selectedExerciseIndex: 0,
          exercises: [{
            name: 'Intro',
            description: `
          <h1>Let's inject parent component!</h1>
          <p>In this milestone we'll create create a ContextAdComponent. </p>
          <p>This component will not use inputs. Instead it will require parent (Video) component and directly look at it's properties. </p>
          <p>It will display different text depending of if there's a word 'music' in the description. </p>
              
            <div class = "inBrowser">
              <div class="smaller">   
                <div>
                  <h2>Cute kitten dancing</h2>
                  <img  src="/assets/images/cat-0.png">            
                  <div>Decription: music</div>
                  <button>Show meta</button>
                  <button>Thumbs Up</button> <button>Thumbs Down</button>
                  <div>Context ad: Turn up your speakers</div>                  
                </div>
                <div>
                  <h2>Cute kitten sleeping</h2>
                  <img  src="/assets/images/cat-0.png">            
                  <div>Decription: sleeping</div>
                  <button>Show meta</button>
                  <button>Thumbs Up</button> <button>Thumbs Down</button>
                  <div>Context ad: Check out our web site.</div>                  
                </div>
              </div>
            </div>          
                 
             <p>Note, we are actually calling it ContextComponent, because when it was called ContextAdComponent, adblock blocked it, and I spent 2 hours debugging. </p>
              
                   
        `,
            fileTemplates: [],
            tests: [],
            messageNext: `I'm a ready, let's start!`
          },
            {
              name: 'Inject parent component',
              description: `<p>Create a Context(Ad)Component</p>
            <p>which will inject it's parent component, see what thedescription, and display the value accordingly.</p>
            <p>Note: We had to get rid of the 'Ad' part of the component, because AdBlock blocked the template.</p>`,
              solutions: [
                files.contextComponent.contextComponentUseSolved
              ],
              fileTemplates: [
                files.contextComponent.contextComponentUse,
                {
                  filename: 'context/context.html',
                  moduleName: 'context',
                  code: '{{text}}',
                  type: 'html'
                },
                ...justForReference(
                  files.contextService.contextComponentUse,
                  files.appModule.contextComponentUse,
                  files.videoHtml.contextComponentUse,
                  files.videoComponent.contextComponentUse,
                  files.togglePanelHtml.contextComponentUse,
                  files.togglePanelComponent.contextComponentUse,
                  files.appHtml.contextComponentUse,
                  files.appComponent.contextComponentUse,
                  files.videoService.contextComponentUse,
                  files.videoItem.contextComponentUse,
                  files.api.contextComponentUse,
                  files.thumbsHtml.contextComponentUse,
                  files.thumbsComponent.contextComponentUse,
                  files.bootstrap.contextComponentUse
                ),
                files.test.contextComponentUse
              ],
              tests: []
            }]
        },

        {
          name: 'Pipes',
          selectedExerciseIndex: 0,
          exercises: [{
            name: 'Create a pipe',
            description: 'Create a fuzzy pipe, which takes a date in YYYY-MM-DD format, and returns how many days ago this was.',
            solutions: [
              files.fuzzyPipe.fuzzyPipeCreateSolved,
            ],
            fileTemplates: [
              evaled(files.fuzzyPipe.fuzzyPipeCreate),
              files.test.fuzzyPipeCreate
            ],
            tests: []
          }, {
            name: 'Use the pipe',
            description: 'Now include the app in the module and use in the app.',
            solutions: [
              files.appModule.fuzzyPipeUseSolved,
              files.videoHtml.fuzzyPipeUseSolved,
            ],
            fileTemplates: [
              files.appModule.fuzzyPipeUse,
              files.videoHtml.fuzzyPipeUse,
              ...justForReference(
                files.fuzzyPipe.fuzzyPipeUse,
                files.contextService.fuzzyPipeUse,
                files.videoComponent.fuzzyPipeUse,
                files.togglePanelHtml.fuzzyPipeUse,
                files.togglePanelComponent.fuzzyPipeUse,
                files.appHtml.fuzzyPipeUse,
                files.appComponent.fuzzyPipeUse,
                files.videoService.fuzzyPipeUse,
                files.videoItem.fuzzyPipeUse,
                files.api.fuzzyPipeUse,
                files.thumbsHtml.fuzzyPipeUse,
                files.thumbsComponent.fuzzyPipeUse,
                files.contextComponent.fuzzyPipeUse,
                {
                  filename: 'context/context.html',
                  moduleName: 'context',
                  code: '{{text}}',
                  type: 'html'
                },
                files.bootstrap.fuzzyPipeUse
              ),
              files.test.fuzzyPipeUse
            ],
            tests: []
          }]
        },
        /*
         {
         name: 'Tests',
         selectedExerciseIndex: 0,
         exercises: [{
         name: 'Sample tests',
         description: `
         <p>In this milestone instead of changing the code to pass the test
         you'll have to change the test to pass the code. </p>

         <p>This milestone is experimental and temporarily uses 'mocha' and 'chai' instead of jasmine.</p>
         `,
         fileTemplates: [
         Object.assign(testFile(), {hidden: false}),
         tsFile('FuzzyPipe', {readonly: true, path: '7-pipes/0-create-pipe/solution'}),
         testFile(),
         ...hidden(
         htmlFile('context', {path: '6-children'}),
         tsFile('VideoComponent', {path: '6-children'}),
         htmlFile('togglepanel', {path: '5-content-projection/0-add-toggle-panel-component/solution'}),
         tsFile('AppComponent', {path: '4-component-tree/1-use-video-component/solution'}),
         sharedAppBootstrap({hidden: true}),
         sharedVideoInterface({hidden: true}),
         sharedTsFile('VideoService', {hidden: true}),
         sharedApiFile({hidden: true})
         )
         ],
         tests: []
         }]
         },*/
        {
          name: 'Survey',
          selectedExerciseIndex: 0,
          exercises: [{
            name: 'All done!',
            description: `
        Please fill out <a href = "https://docs.google.com/forms/d/1lGPvmCftArLXVuJkO6L7sXZiqIDj-DtiPM0MQJXLJTA/edit">The survey</a>
        (which is different from the feedback form)
`,
            fileTemplates: [],
            tests: []
          }]
        }
      ]
    }
  }
}
