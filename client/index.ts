
import './style.scss';

import $ from 'jquery';

import Backbone from 'backbone';

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

class PersonsView extends Backbone.View<Person> {
  busy: boolean;
  
  constructor(options?: Backbone.ViewOptions) {
    super({...{tagName: 'ul', className: 'people'}, ...options});

    this.listenTo(this.collection, 'request', this.onRequest);
    this.listenTo(this.collection, 'sync', this.onSync);
  }

  onRequest() {
    this.busy = true;
    this.render();
  }
  
  onSync() {
    this.busy = false;
    this.render();
  }
  
  render() {
    this.$el.empty();

    if(this.busy) {
      this.$el.text('Loading...');
      return this;
    }

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

class PersonCollection extends Backbone.Collection<Person> {
  url: string = '/people';
}

class App extends Backbone.View {
  persons: PersonCollection;
  personsView: PersonsView;
  
  constructor(options?: Backbone.ViewOptions) {
    super({...{className: 'app'}, ...options});
    this.persons = new PersonCollection();
    this.personsView = new PersonsView({collection: this.persons});
    this.persons.fetch();
  }
  
  render() {
    this.$el.empty();

    this.$el.append(this.personsView.render().el)
    return this;
  }
}

$(() => {
  
  const app = new App();
  const $node : JQuery<HTMLElement> = $('<div class="app-container"></div>');
  $node.append(app.render().el);
  
  $('body').append($node);
});
