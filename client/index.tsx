
import './style.scss';

import { combineReducers, Dispatch, Action, createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import { connect } from 'react-redux';
import { ThunkAction, ThunkDispatch } from 'redux-thunk';
import thunkMiddleware from 'redux-thunk';
import update from 'immutability-helper';

import React from 'react';
import ReactDOM from 'react-dom'

const REQUEST_PERSONS = 'REQUEST_PERSONS';
const REQUEST_PERSONS_ERROR = 'REQUEST_PERSONS_ERROR';
const FINISH_REQUEST_PERSONS = 'FINISH_REQUEST_PERSONS';
const FORGET_PERSONS = 'FORGET_PERSONS';
const DELETE_PERSON = 'DELETE_PERSON';
const DELETE_PERSON_ERROR = 'DELETE_PERSON_ERROR';
const FINISH_DELETE_PERSON = 'FINISH_DELETE_PERSON';

interface DeletePersonAction {
  type: typeof DELETE_PERSON
}

interface DeletePersonErrorAction {
  type: typeof DELETE_PERSON_ERROR
}

interface FinishDeletePersonAction {
  type: typeof FINISH_DELETE_PERSON,
  person: Person
}

interface ForgetPersonsAction {
  type: typeof FORGET_PERSONS
}

interface RequestPersonsErrorAction {
  type: typeof REQUEST_PERSONS_ERROR,
}

interface RequestPersonsAction {
  type: typeof REQUEST_PERSONS
}

interface FinishRequestPersonsAction {
  type: typeof FINISH_REQUEST_PERSONS,
  persons: Person[]
}

export type PersonsActionTypes = RequestPersonsAction | RequestPersonsErrorAction | FinishRequestPersonsAction |
                                 ForgetPersonsAction | DeletePersonAction | DeletePersonErrorAction |
                                 FinishDeletePersonAction;

interface MainUIState {
  busy: boolean
}

interface GlobalState {
  persons: Person[],
  mainUi: MainUIState
}

function forgetPersons(): PersonsActionTypes {
  return {
    type: FORGET_PERSONS
  }
}

function requestPersons(): PersonsActionTypes {
  return {
    type: REQUEST_PERSONS
  }
}

function receivePersons(persons: Person[]): PersonsActionTypes {
  return {
    type: FINISH_REQUEST_PERSONS,
    persons: persons
  }
}

function deletePerson(): PersonsActionTypes {
  return {
    type: DELETE_PERSON
  }
}

function deletePersonError(): PersonsActionTypes {
  return {
    type: DELETE_PERSON_ERROR
  }
}

function finishDeletePerson(person: Person): PersonsActionTypes {
  return {
    type: FINISH_DELETE_PERSON,
    person: person
  }
}

function startDeletePerson(id: number): (dispatch: Dispatch<PersonsActionTypes>, getState: () => GlobalState) => void {
  return (dispatch: Dispatch<PersonsActionTypes>, getState: () => GlobalState) => {
    dispatch(deletePerson());

    fetch('/persons/' + id, {method: 'DELETE'})
      .then(response => response.json())
      .then(person => dispatch(finishDeletePerson(person)));
  }
}

type MyExtraArg = undefined;
type MyThunkDispatch = ThunkDispatch<GlobalState, MyExtraArg, Action>;

function fetchPersons(): (dispatch: Dispatch<PersonsActionTypes>, getState: () => GlobalState) => void {
  return (dispatch: Dispatch<PersonsActionTypes>, getState: () => GlobalState) => {
    dispatch(requestPersons())

    fetch('/persons')
      .then(response => response.json())
      .then((persons: Person[]) => {
        dispatch(receivePersons(persons))
      })
  }
}

const persons = function(state: Person[] = [], action: PersonsActionTypes) {
  switch(action.type) {
    case FINISH_REQUEST_PERSONS:
      return action.persons;
    case FORGET_PERSONS:
      return [];
    case FINISH_DELETE_PERSON:
      const index = state.findIndex((el) => { return el.id == action.person.id })
      return update(state, {$splice: [[index, 1]]})
    default:
      return state;
  }
}

const mainUi = function(state: MainUIState = {
  busy: false
}, action: PersonsActionTypes) {
  switch(action.type) {
    case REQUEST_PERSONS:
      return {...state, ...{busy: true}};
    case FINISH_REQUEST_PERSONS:
      return {...state, ...{busy: false}};
    case DELETE_PERSON:
      return {...state, ...{busy: true}};
    case DELETE_PERSON_ERROR:
    case FINISH_DELETE_PERSON:
      return {...state, ...{busy: false}};
    default:
      return state
  }
}

const rootReducer = combineReducers({mainUi, persons})

const makeStore = function() { return createStore( rootReducer, applyMiddleware(thunkMiddleware) ) }

interface Person {
  id: number,
  name: string
}

interface PersonState {
  persons: Person[],
  fetched: boolean,
  error: string,
  name: string
}

interface PersonProps {
  busy: boolean,
  persons: Person[],
  fetchPersons: () => void,
  forget: () => void,
  deletePerson: (id: number) => void
};

class PersonList extends React.Component<PersonProps> {
  state: PersonState;
  
  constructor(props: PersonProps) {
    super(props);
    this.state = {
      persons: [],
      fetched: false,
      error: "",
      name: ""
    }

    this.onForget = this.onForget.bind(this);
    this.onNameChange = this.onNameChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.onDelete = this.onDelete.bind(this);
  }

  componentDidMount() {
    if(!this.state.fetched) {
      this.props.fetchPersons();
      this.setState({fetched: true});
    }
  }

  onNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({name: e.target.value});
  }
  
  onSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    fetch('/people', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({name: this.state.name})
    })
      .then(response => response.json())
      .then(data => this.setState((prevState) => {
        return {...update(prevState, {persons: {$push: [data]}}), ...{name: ""}};
      }))
      .catch(e => {
        this.setState({error: "An error occurred when creating the person record"});
      });
  }

  onForget(e: React.MouseEvent) {
    e.preventDefault();
    this.props.forget();
  }

  onDelete(e: React.MouseEvent, id: number) {
    e.preventDefault();
    this.props.deletePerson(id);
  }
  
  render() {
    const busyMsg = this.props.busy ? (<div>Loading...</div>) : null;
    
    const errorMsg = this.state.error !== '' ? (<div className={"alert alert-danger"}>{this.state.error}</div>) : null;
    
    const lis = this.props.persons.map((person) => (
      <li key={person.id}>{person.name} <a href="#" onClick={(e: React.MouseEvent) => this.onDelete(e, person.id)}>[Delete]</a></li>
    ));
    
    return (
      <div>
        {busyMsg}
        
        {errorMsg}
        
        <ul className="people">{lis}</ul>

        <form onSubmit={this.onSubmit}>
          <input type="text" name="name" onChange={this.onNameChange} value={this.state.name} placeholder="Name"></input>
        </form>

        <br/>
        <a href="#" onClick={this.onForget}>Forget</a>
      </div>
    );
  }
}

const mapStateToProps = (state: GlobalState) => {
  return {...state.mainUi, persons: state.persons};
}

const mapDispatchToProps = (dispatch: MyThunkDispatch) => {
  return {
    fetchPersons: () => dispatch(fetchPersons()),
    forget: () => dispatch(forgetPersons()),
    deletePerson: (id: number) => dispatch(startDeletePerson(id))
  }
}

const PersonListContainer = connect(mapStateToProps, mapDispatchToProps)(PersonList)

const App = () => {
  return (
    <div className="app">
      <div className="app">Welcome to the app.</div>
      <Provider store={makeStore()}>
        <PersonListContainer/>
      </Provider>
    </div>
  );
}

addEventListener('DOMContentLoaded', () => {
  const node = document.createElement('div');
  node.className = "app-container";

  const body = document.querySelector('body');
  body.appendChild(node);
  
  ReactDOM.render(<App/>, node)
})

