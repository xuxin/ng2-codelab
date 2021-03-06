import {Injectable} from "@angular/core";
import {CodelabConfig} from "./codelab-config";
import {ActionTypes} from "./action-types.enum";
import {selectedMilestone, selectedExercise} from "./state.service";
import {FileConfig} from "./file-config";
import {TestInfo} from "./test-info";
import {Observable} from "rxjs/Rx";
import {AngularFire} from "angularfire2";
import {ExerciseService} from "./exercise.service";
import {MonacoConfigService} from "./monaco-config.service";

@Injectable()
export class ReducersService {
  [ActionTypes.INIT_STATE](state: CodelabConfig) {
    const localState = JSON.parse(localStorage.getItem('state'));
    const actualState = (state.app.preserveState && localState) ? localState : state;
    actualState.app = state.app;
    return actualState;
  }

  [ActionTypes.TOGGLE_AUTORUN](state: CodelabConfig) {
    state.autorun = !state.autorun;
    return state;
  }

  [ActionTypes.OPEN_FEEDBACK](state: CodelabConfig) {
    state.page = 'feedback';
    return state;
  }

  [ActionTypes.RUN_CODE](state: CodelabConfig) {
    // Runner watches for changes to runId, and reruns the code on update.
    // This is probably not the most intuitive way to do things.
    if (state.app.debug) {
      state.debugTrackTime = (new Date()).getTime();
      console.log('RUN START');
    }

    state.runId++;
    return state;
  }

  [ActionTypes.SET_AUTH](state: CodelabConfig, {data}: {data: {}}) {
    state.auth = data;
    return state;
  }

  [ActionTypes.SIMULATE_STATE](state: CodelabConfig, {data}: {data: CodelabConfig}) {
    data.auth = state.auth;
    return data;
  }

  [ActionTypes.SELECT_MILESTONE](state: CodelabConfig, {data}: {data: number}) {
    state.page = 'milestone';
    state.selectedMilestoneIndex = data;
    const nextIndex = selectedMilestone(state).selectedExerciseIndex;
    return this[ActionTypes.SELECT_EXERCISE](state, Object.assign({}, data, {data: nextIndex}));
  }

  [ActionTypes.TOGGLE_FILE](state: CodelabConfig, {data}: {data: FileConfig}) {
    const milestone = state.milestones[state.selectedMilestoneIndex];
    let exercise = milestone.exercises[milestone.selectedExerciseIndex];

    exercise.editedFiles.forEach((file) => {
      if (file === data) {
        file.collapsed = !file.collapsed;
      }
    });

    return state;
  }

  [ActionTypes.LOAD_ALL_SOLUTIONS](state: CodelabConfig) {
    const milestone = state.milestones[state.selectedMilestoneIndex];
    let exercise = milestone.exercises[milestone.selectedExerciseIndex];

    return exercise.editedFiles.reduce((state, file) => {
      if (file.solution) {
        return this[ActionTypes.UPDATE_CODE](state, {data: {file: file, code: file.solution}})
      }
      return state;
    }, state);
  }

  [ActionTypes.LOAD_SOLUTION](state: CodelabConfig, {data}: {data: FileConfig}) {
    const milestone = state.milestones[state.selectedMilestoneIndex];
    let exercise = milestone.exercises[milestone.selectedExerciseIndex];

    exercise.editedFiles = exercise.editedFiles.map((file) => {
      if (file === data) {
        file = Object.assign(file, {code: file.solution});
      }
      return file;
    });

    return state;
  }

  [ActionTypes.UPDATE_CODE](state: CodelabConfig, {data}: {data: {file: FileConfig, code: string}}) {
    const milestone = state.milestones[state.selectedMilestoneIndex];
    let exercise = milestone.exercises[milestone.selectedExerciseIndex];

    exercise.editedFiles.forEach((file) => {
      if (file === data.file) {
        file.code = data.code;
      }
    });

    this.monacoConfig.monacoReady.then(() => {
      this.monacoConfig.updateDeclarations(exercise.editedFiles);
    });

    return state.autorun ? this[ActionTypes.RUN_CODE](state) : state;
  }

  [ActionTypes.SET_TEST_LIST](state: CodelabConfig, action: {data: Array<string>}) {

    selectedExercise(state).tests = action.data.map(test => ({title: test}));
    return state;
  }

  [ActionTypes.UPDATE_SINGLE_TEST_RESULT](state: CodelabConfig, action: {data: TestInfo}) {
    selectedExercise(state).tests.forEach(test => {
      if (test.title === action.data.title) {
        test.pass = action.data.pass;
        test.result = action.data.result;
      }
    });

    if (state.app.debug) {
      if (!selectedExercise(state).tests.find(t => t.pass === undefined)) {
        console.log('RUN COMPLETE', (new Date()).getTime() - state.debugTrackTime);
      }
    }

    return state;
  }

  [ActionTypes.NEXT_EXERCISE](state: CodelabConfig) {
    let milestone = selectedMilestone(state);
    let nextIndex = milestone.selectedExerciseIndex + 1;
    // Check if we still have exercises left in the milestone.
    if (milestone.exercises.length > nextIndex) {
      return this[ActionTypes.SELECT_EXERCISE](state, {data: nextIndex});
    } else {
      // Looks like we're at the end of the milestone, let's move on to the next one!
      let nextMilestoneIndex = state.selectedMilestoneIndex + 1;
      if (state.milestones.length > nextMilestoneIndex) {
        return this[ActionTypes.SELECT_MILESTONE](state, {data: nextMilestoneIndex});
      }
    }
    return state;
  }

  [ActionTypes.SEND_FEEDBACK](state: CodelabConfig, feedback) {
    if (state.app.feedbackEnabled) {
      let items = this.angularFire.database.list('/feedback');
      items.push({
        comment: feedback.data.comment,
        state: JSON.parse(JSON.stringify(state)),
        name: feedback.data.username
      });
      state.user = feedback.data.username;
    }
    return state;
  }

  [ActionTypes.SELECT_EXERCISE](state: CodelabConfig, {data}: {data: number}): CodelabConfig | Observable<CodelabConfig> {
    state.milestones[state.selectedMilestoneIndex].selectedExerciseIndex = data;
    const exerciseConfig = state.milestones[state.selectedMilestoneIndex].exercises[data];
    if (exerciseConfig.editedFiles) {
      return state;
    }

    exerciseConfig.editedFiles = exerciseConfig
      .fileTemplates
      .map((file: FileConfig) => {
        if (!file) {
          console.log(exerciseConfig.fileTemplates);
          debugger
        }
        if (exerciseConfig.solutions) {
          const solution = exerciseConfig.solutions.find(f => f.filename === file.filename);
          if (solution) {
            file.solution = solution.code;
          }
        }

        return Object.assign({}, file);
      });

    this.monacoConfig.monacoReady.then(() => {
      this.monacoConfig.cleanUpDeclarations();
      this.monacoConfig.updateDeclarations(exerciseConfig.editedFiles);
    });

    return this[ActionTypes.RUN_CODE](state);
  }

  constructor(protected exerciseService: ExerciseService,
              protected angularFire: AngularFire,
              protected monacoConfig: MonacoConfigService) {


  }


}
