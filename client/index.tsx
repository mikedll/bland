
import './style.scss';

import update from 'immutability-helper';

import React from 'react';
import ReactDOM from 'react-dom'

interface PersonProps {};

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

class PersonList extends React.Component {
  state: PersonState;
  
  constructor(props?: PersonProps) {
    super(props);
    this.state = {
      persons: [],
      fetched: false,
      error: "",
      name: ""
    }

    this.onNameChange = this.onNameChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  componentDidMount() {
    if(!this.state.fetched) {

      fetch('/people')
        .then(response => response.json())
        .then(data => this.setState({fetched: true, persons: data}))
        .catch(e => {
          this.setState({fetched: true, error: "An error occurred while fetching records."});
        })
      
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
  
  render() {

    const errorMsg = this.state.error !== '' ? (<div className={"alert alert-danger"}>{this.state.error}</div>) : null;
    
    const lis = this.state.persons.map((person) => (
      <li key={person.id}>{person.name}</li>
    ));
    
    return (
      <div>
        
        {errorMsg}
        
        <ul className="people">{lis}</ul>

        <form onSubmit={this.onSubmit}>
          <input type="text" name="name" onChange={this.onNameChange} value={this.state.name} placeholder="Name"></input>
        </form>
      </div>
    );
  }
}


const App = () => {
  return (
    <div className="app">
      <div className="app">Welcome to the app.</div>
      <PersonList/>
    </div>
  );
}

addEventListener('DOMContentLoaded', () => {
  const node = document.createElement('div');
  node.className = "app-container";

  const body = document.querySelector('body');
  body.appendChild(node);
  
  ReactDOM.render(<App/>, document.querySelector('.app-container'))
})

