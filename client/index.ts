
import './style.scss';

import $ from 'jquery';

import Backbone from 'backbone';

class App extends Backbone.View {
  constructor(options?: Backbone.ViewOptions) {
    super({...{className: 'app'}, ...options});
  }
  
  render() {
    this.$el.text('This is Mike\'s app.');
    return this;
  }
}

$(() => {

  const app = new App();
  const $node : JQuery<HTMLElement> = $('<div class="app-container"></div>');

  $node.append(app.render().el);
  
  $('body').append($node);
});
