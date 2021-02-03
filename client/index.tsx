
import './style.scss';

import React from 'react';

import ReactDOM from 'react-dom'

const App = () => {
  return (
    <div className="app">Welcome to the app.</div>
  );
}

addEventListener('DOMContentLoaded', () => {
  const node = document.createElement('div');
  node.className = "app-container";

  const body = document.querySelector('body');
  body.appendChild(node);
  
  ReactDOM.render(<App/>, document.querySelector('.app-container'))
})

