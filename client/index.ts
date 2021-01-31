
import './style.scss';

import $ from 'jquery';

import Backbone from 'backbone';

class Person extends Backbone.Model {
}

class PersonView extends Backbone.View {
  constructor(options?: Backbone.ViewOptions) {
    super({...{tagName: 'li'}, ...options})

    this.listenTo(this.model, 'sync', this.onSync)
  }

  onSync() {
    this.render();
  }

  render() {
    let s: string;
    if(this.model.isNew()) {
      s = '(new): ' + this.model.get('name');
    } else {
      s = this.model.get('id') + ': ' + this.model.get('name');
    }      
    this.$el.text(s);
    return this;
  }
}

class PersonsView extends Backbone.View<Person> {
  busy: boolean;
  $ul: JQuery<HTMLElement>;
  $leadIn: JQuery<HTMLElement>;
  
  constructor(options?: Backbone.ViewOptions) {
    super(options);

    this.listenTo(this.collection, 'request', this.onRequest);
    this.listenTo(this.collection, 'sync', this.onSync);
    this.listenTo(this.collection, 'add', this.onAdd);
  }

  onAdd(model: Person) {
    if(this.$ul === undefined) return;

    const view = new PersonView({model: model});
    this.$ul.append(view.render().el);
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
    if(this.$ul === undefined) {
      this.$leadIn = $('<div class="lead-in"></div>');
      this.$el.append(this.$leadIn);
      this.$ul = $('<ul></ul>');
      this.$el.append(this.$ul);
    }
    
    if(this.busy) {
      this.$leadIn.text('Loading...');
    } else {
      this.$leadIn.text('');
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
    const events = {
      'submit form': 'onSubmit'
    }
    
    super({...{className: 'app', events: events}, ...options});
    this.persons = new PersonCollection();
    this.personsView = new PersonsView({collection: this.persons});
    this.persons.fetch();
  }

  onSubmit(e: JQuery.TriggeredEvent) {
    e.preventDefault();
    const $input = this.$el.find('form input[name="name"]');
    const person = new Person({name: $input.val()})
    this.persons.add(person)
    $input.val('');
    person.save();
  }
  
  render() {
    this.$el.empty();

    this.$el.append(this.personsView.render().el)

    const $form: JQuery<HTMLElement> = $('<form><input name="name" type="text"></input></form>');
    this.$el.append($form);
    return this;
  }
}

$(() => {
  
  const app = new App();
  const $node : JQuery<HTMLElement> = $('<div class="app-container"></div>');
  $node.append(app.render().el);
  
  $('body').append($node);
});
