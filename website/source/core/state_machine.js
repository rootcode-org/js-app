// Copyright is waived. No warranty is provided. Unrestricted use and modification is permitted.

class StateMachine {

    constructor(owner, states, initialState) {
        this.owner = owner;
        this.states = states;
        this.currentState = [];         // odd, but we have to do this so the closure compiler doesn't complain
        this.nextState = [];            // "
        this.currentState = null;
        this.nextState = null;
        this.requestState(initialState);
    }

    requestState(state) {
        if (state === null) {
            // Requesting a null state exits the current state
            if (this.currentState !== null) {
                let exitFunction = this.currentState[3];
                if (exitFunction !== null) {
                    exitFunction.call(this.owner);
                }
                this.currentState = null;
                this.nextState = null;
            }
        } else if (!(state in this.states)) {
            Log.error("State " + state + " does not exist");
        } else {
            let stateData = this.states[state];
            if (stateData !== this.currentState) {
                // Queue the requested state if it has a higher priority than the existing next state
                if ((this.nextState === null) || (stateData[0] < this.nextState[0])) {
                    this.nextState = stateData;
                }
            }
        }
    }

    update() {
        let entryFunction;
        let updateFunction;
        let exitFunction;

        // enter new state if requested
        if (this.nextState !== null) {

            // exit current state
            if (this.currentState !== null) {
                exitFunction = this.currentState[3];
                if (exitFunction !== null) {
                    exitFunction.call(this.owner);
                }
            }

            // enter new state
            this.currentState = this.nextState;
            this.nextState = null;
            entryFunction = this.currentState[1];
            if (entryFunction !== null) {
                entryFunction.call(this.owner);
            }
        }

        // update state
        if (this.currentState !== null) {
            updateFunction = this.currentState[2];
            if (updateFunction !== null) {
                updateFunction.call(this.owner);
            }
        }

        // exit current state if a new state was requested during the update
        if (this.nextState !== null) {
            if (this.currentState !== null) {
                exitFunction = this.currentState[3];
                if (exitFunction !== null) {
                    exitFunction.call(this.owner);
                }
                this.currentState = null;
            }
        }
    }
}
