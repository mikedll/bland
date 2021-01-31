
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

class PersonsView extends Backbone.View {
  constructor(options?: Backbone.ViewOptions) {
    super({...{tagName: 'ul', className: 'people'}, ...options});

    this.listenTo(this.collection, 'reset', this.render)
  }
  
  render() {
    this.$el.empty();

    if(this.collection.length === 0) {
      this.$el.text("No persons.");
    } else {
      this.collection.each(person => {
        const personView = new PersonView({model: person});
        this.$el.append(personView.render().el);
      });
    }

    return this;
  }
}

class PersonCollection extends Backbone.Collection {
}

class App extends Backbone.View {
  busy: boolean;
  persons: PersonCollection;
  personsView: PersonsView;
  
  constructor(options?: Backbone.ViewOptions) {
    super({...{className: 'app'}, ...options});
    this.persons = new PersonCollection();
    this.personsView = new PersonsView({collection: this.persons});
    this.busy = false;
  }

  fetch() {
    this.busy = true;
    $.ajax({url: '/people',
            dataType: 'json',
            success: (data: PersonJson[]) => {
              this.busy = false;
              this.render();
              this.persons.reset(data.map(d => new Person(d)));
            }
           });
  }
  
  render() {
    this.$el.empty();

    if(this.busy) {
      this.$el.text('Loading...');
    } else {
      this.$el.append(this.personsView.render().el)
    }
    return this;
  }
}

$(() => {
  
  const app = new App();
  app.fetch();  

  const $node : JQuery<HTMLElement> = $('<div class="app-container"></div>');
  $node.append(app.render().el);
  
  $('body').append($node);
});
