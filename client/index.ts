
import './style.scss';

import $ from 'jquery';

import Backbone from 'backbone';

interface Person {
  id: number,
  name: string
}

class App extends Backbone.View {
  people: Person[];
  
  constructor(options?: Backbone.ViewOptions) {
    super({...{className: 'app'}, ...options});
    this.people = []
  }

  setPeople(people: Person[]) {
    this.people = people;
    this.render();
  }
  
  render() {
    this.$el.empty();

    if(this.people !== undefined) {
      if(this.people.length === 0) {
        this.$el.text("No persons.");
      } else {
        const $ul = $('<ul class="people"></ul>')
        this.people.forEach((person: Person) => {
          $ul.append($('<li>' + person.id + " -> " + person.name + '</li>'));
        });
        this.$el.append($ul);
      }
    } else {
      this.$el.text('Loading...');
    }
    return this;
  }
}

$(() => {
  
  const app = new App();
  const $node : JQuery<HTMLElement> = $('<div class="app-container"></div>');

  $node.append(app.render().el);

  $.ajax({url: '/people',
          dataType: 'json',
          success: (data: Person[]) => { app.setPeople(data); }
          });
  
  
  $('body').append($node);
});
