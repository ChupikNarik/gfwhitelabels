define(function() {
    return {
        login: Backbone.View.extend({
            events: {
                'submit .login-form': 'login',
            },
            initialize: function(options) {
                this.template = options.template;
            },

            render: function() {
                this.$el.html(
                    window.userLogin({})
                );
                return this;
            },

            login: function(event) {
                event.preventDefault();
                var form = $(event.target);
                app.showLoading();
                this.$('form > .alert-warning').html('');
                var data = form.serializeObject();

                $.ajax({
                    url: serverUrl + Urls['rest_login'](),
                    method: 'POST',
                    data: data,
                    success: (xhr) => {
                        defaultSaveActions.success(this, xhr);
                        if(xhr.hasOwnProperty('key')) {
                            localStorage.setItem('token', xhr.key);
                            window.location = '/account/profile/' //data.next ? data.next : '/account/profile'
                        } else {
                            Backbone.Validation.callbacks.invalid(                                 
                              form, '', 'Server return no authentication data'
                            );
                        }
                    },
                    error: (xhr, status, text) => {
                        defaultSaveActions.error(this, xhr, status, text);
                    }
                });
            },
        }),

        signup: Backbone.View.extend({
            initialize: function(options) {
                this.template = options.template;
            },

            render: function() {
                this.$el.append(
                    _.template(this.template)({
                        serverUrl: serverUrl,
                    })
                );
                return this;
            },
        }),

        profile: Backbone.View.extend({
            events: {
                'submit form': 'update',
            },
            initialize: function(options) {
                this.template = options.template;
            },

            update: function(event) {
                event.preventDefault();
                let data = $(event.target).serializeObject();

                this.model.set(data);
                if(this.model.isValid(true)) {
                    this.model.save();
                }
            },

            render: function() {
                requirejs(['dropzone',], (dropzone) => {
                    this.$el.html(
                        _.template(this.template)({
                            serverUrl: serverUrl,
                            model: app.user,
                            user: app.user.attributes,
                        })
                    );
                    createFileDropzone('image', 'avatars', '', function() { console.log('hello'); });
                    return this;
                });
            },
        }),
    
    }
});