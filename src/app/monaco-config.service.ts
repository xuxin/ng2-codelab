import {Injectable} from "@angular/core";
import {FileConfig} from "./file-config";

declare const monaco;

interface DeclarationConfig {
  dispose: {dispose: ()=>void},
  file: FileConfig,
  code: string
}
@Injectable()
export class MonacoConfigService {
  public monacoReady;
  private declarations: {[key: string]: DeclarationConfig } = {};

  constructor() {
    this.monacoReady = new Promise((resolve) => {
      const onGotAmdLoader = () => {
        (<any>window).require.config({paths: {'vs': 'assets/monaco/vs'}});
        (<any>window).require(['vs/editor/editor.main'], () => {
          MonacoConfigService.configureMonaco();
          resolve(monaco);
        });
      };

      // Load AMD loader if necessary
      if (!(<any>window).require) {
        const loaderScript = document.createElement('script');
        loaderScript.type = 'text/javascript';
        loaderScript.src = 'assets/monaco/vs/loader.js';
        loaderScript.addEventListener('load', onGotAmdLoader);
        document.body.appendChild(loaderScript);
      } else {
        onGotAmdLoader();
      }
    });

  }

  static configureMonaco() {
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      experimentalDecorators: true,
      allowNonTsExtensions: true,
      noImplicitAny: true,
    });

    // Some fake angular deps, good for catching silly errors.
    // I'd still prefer to have the full version.
    const core = `
        declare module '@angular/core' {
          export class EventEmitter<T> {
            emit: function(param: T);
          }       
            
          export interface ComponentConfig {
            selector: string;
            template?: string;
            templateUrl?: string;
          }
          
          export interface PipeConfig {
            name: string;           
          }
          
          export function Component(config: ComponentConfig);
          
          export interface NgModuleConfig {
            imports?: any[];
            declarations?: any[];
            providers?: any[];
            bootstrap?: any[];           
          }
          export function NgModule(config: NgModuleConfig);
          export function Injectable();
          export function Output();
          export function Input();
          export function Pipe(config: PipeConfig);
          export interface PipeTransform {
            transform(value: string);
          }
                    
        }  
           
        declare var x = 1;
           
        declare module '@angular/platform-browser' {
          export class BrowserModule {}                        
        }                                                        

        declare module '@angular/platform-browser-dynamic' {
          export class Platform {
            bootstrapModule: function();
          }
          export function platformBrowserDynamic(): Platform;                       
        }       
        
        declare module '@angular/compiler' {
          export class ResourceLoader {           
          }
        }       
                                                         
                                                         
        `;

    if (!monaco.languages.typescript.typescriptDefaults._extraLibs['./AppComponent.d.ts']) {
      monaco.languages.typescript.typescriptDefaults.addExtraLib(core, '@angular/core.d.ts');
    }
  }

  cleanUpDeclarations() {
    Object.keys(this.declarations)
      .forEach(key => this.disposeDeclaration(this.declarations[key].file));
  }

  disposeDeclaration(file: FileConfig) {
    const filename = MonacoConfigService.normalize(file.filename);

    this.declarations[filename].dispose.dispose();
    delete this.declarations[filename];
  }

  static normalize(filename: string) {
    return filename.replace(/.*\//, '');
  }

  addDeclaration(file: FileConfig) {
    // Flatten the file structure.
    // This is a temporary hacks, seems like monaco ignores file location for relative imports.
    // it assumes that there are no files with the same filename in different folders.
    const filename = MonacoConfigService.normalize(file.filename);
    const normalized = monaco.languages.typescript.typescriptDefaults.addExtraLib(file.code, `inmemory://model/${filename}`);
    let initial;
    if (filename !== file.filename) {
      initial = monaco.languages.typescript.typescriptDefaults.addExtraLib(file.code, `inmemory://model/${file.filename}`);
    }


    this.declarations[filename] = {
      dispose: {
        dispose(){
          normalized.dispose();
          if (initial) {
            initial.dispose();
          }
        }
      },
      file: file,
      code: file.code
    }
  }

  updateDeclaration(file: FileConfig) {
    const filename = MonacoConfigService.normalize(file.filename);
    let declaration = this.declarations[filename];

    if (declaration) {
      if (declaration.code === file.code) {
        return;
      } else {
        this.disposeDeclaration(file);
      }
    }

    this.addDeclaration(file);
  }

  updateDeclarations(files: FileConfig[]) {
    files.forEach((file) => this.updateDeclaration(file));
  }
}
