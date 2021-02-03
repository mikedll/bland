
import './style.scss';

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
  error: string
}

class PersonList extends React.Component {
  state: PersonState;
  
  constructor(props?: PersonProps) {
    super(props);
    this.state = {
      persons: [],
      fetched: false,
      error: ""
    }
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
  
  render() {

    const errorMsg = this.state.error !== '' ? (<div className={"alert alert-danger"}>{this.state.error}</div>) : null;
    
    const lis = this.state.persons.map((person) => (
      <li key={person.id}>{person.name}</li>
    ));
    
    return (
      <div>
        
        {errorMsg}
        
        <ul className="people">{lis}</ul>
        
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

