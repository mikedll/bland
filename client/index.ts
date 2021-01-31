
import './style.scss';

import $ from 'jquery';

import Backbone from 'backbone';

interface PersonJson {
  id: number,
  name: string
}

class Person extends Backbone.Model {
}

class PersonView extends Backbone.View {
  constructor(options?: Backbone.ViewOptions) {
    super({...{tagName: 'li'}, ...options})
  }

  render() {
    this.$el.text(this.model.get('id') + ': ' + this.model.get('name'));
    return this;
  }
}

class App extends Backbone.View {
  people: Person[];
  
  constructor(options?: Backbone.ViewOptions) {
    super({...{className: 'app'}, ...options});
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
          const personView = new PersonView({model: person});
          $ul.append(personView.render().el)
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
          success: (data: PersonJson[]) => { app.setPeople(data.map(d => new Person(d))); }
          });
  
  
  $('body').append($node);
});
