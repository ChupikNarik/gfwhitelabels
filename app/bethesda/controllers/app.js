let app = {
    collections: {
    },

    models: {
        campaign: [],
        page: [],
    },

    views: {
        campaign: [],
        page: [],
    },


    routers: {},
    cache: {},

    getModel: function(name, model, id, callback) {
        if(this.models.hasOwnProperty(name) == false) {
            this.models[name] = [];
        }

        if(this.models[name][id] == null) {
            this.models[name][id] = new model({
                id: id
            });
            this.models[name][id].fetch({
                success: callback
            });
        } else {
            callback(this.models[name][id]);
        }
    },
    
    /* 
     * Misc Display Functions 
     *
     */
    showLoading: function() {
        $('.loader_overlay').show();
    },

    hideLoading: function() {
        $('.loader_overlay').hide();
    },

    showError: function(form, type, errors) {
        let msgBox = $(form).find('.error-messages');

        // ToDo
        // Create template/message.js
        // And use messages dynamicly base on the message type
        

        if(msgBox.length == 0) {
            $(form).prepend(`<div class="alert alert-warning" role="alert">
                <strong>Error!</strong>  
            </div>`);
        }
        $('.loader_overlay').hide();
    },
    
    /*
     * Strip /api in urls
     * and remove all urls not related to API
     *
     */
    getUrls: function() {

        $.ajax({
            url: serverUrl + "/jsreverse/",
        }).done(function(oldUrls) {
            oldUrls = eval(oldUrls);
            let newUrls = Object();
            for(k in oldUrls) {
                let v = oldUrls[k](0);
                if(v !== null && v.indexOf('api') != -1) {
                    newUrls[k] = oldUrls[k];
                }
            }
            app.Urls = newUrls;
            console.log(app.Urls);
            app.trigger('urlsReady');
        });
    },
};


requirejs.config({
    //By default load any module IDs from js/lib
    baseUrl: '/',
    //paths: {
    //    urls: serverUrl + '/jsreverse'
    //}
    //except, if the module ID starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
});

requirejs(['/templates/templates.js'], function() {

_.extend(app, Backbone.Events);
app.getUrls();

app.on('urlsReady', function() {

    let appRoutes = Backbone.Router.extend({
        routes: {
          '': 'mainPage',
          'api/campaign': 'campaignList',
          'api/campaign/:id': 'campaignDetail',
          'campaign/:id/invest': 'campaignInvest',
          'page/:id/': 'pageDetail',
          'account/profile/': 'accountProfile',
          'account/login/': 'login',
          'account/logout/': 'logout',
        },
        back: function(event) {
            var url = event.target.pathname;
            if(app.cache.hasOwnProperty(event.target.pathname) == false) {
                window.history.back();
            } else {
                $('#content').html(app.cache[event.target.pathname]);
                app.routers.navigate(
                    event.target.pathname, 
                    {trigger: false, replace: false}
                );
            }
            app.hideLoading();
        },

        campaignList: function() {
            requirejs(['models/campaign', 'views/campaign', ], function(model, view, campaignListT) {
                app.collections.campaigns = new model.collection();
                app.collections.campaigns.fetch({
                    success: (collection, response, options) => {

                        $('#content').html('');
                        app.views.campaigns = new view.list({
                            el: '#content',
                            template: campaignListT,
                            collection: collection, 
                        });
                        app.views.campaigns.render();

                        setTimeout(() => {
                            app.cache[window.location.pathname] = app.views.campaigns.$el.html();
                        }, 500);

                        /*
                        let filterView = new CampaignFilterView();
                        filterView.render();

                        $('#content').append(_.template($('#campaignListT').html())());

                        collection.forEach(function(model) {
                            let campaignView = new CampaignListView({
                                model: model,
                                template: campaignItemListT,
                            });
                            campaignView.render();
                        });
                        */
                        app.hideLoading();
                    }
                });
            });
        },

        campaignDetail: function(id) {
            requirejs(['models/campaign', 'views/campaign', ], (model, view, campaignDetailT) => {

                app.getModel('campaign', model.model, id, function(model) {
                    app.views.campaign[id] = new view.detail({
                        el: '#content',
                        model: model,
                        template: campaignDetailT,
                    });
                    app.views.campaign[id].render();
                    app.cache[window.location.pathname] = app.views.campaign[id].$el.html();
                    $('#content').scrollTo();

                    app.hideLoading();
                });
            });
        },
                                                                                      
        campaignInvest: function(id) {
            requirejs(['models/campaign', 'models/investment', 'views/campaign', ], (model, investModel, view, campaignInvestmentT) => {

                app.getModel('campaign', model.model, id, function(campaignModel) {
                    var i = new view.investment({
                        el: '#content',
                        model: new investModel.model(),
                        campaignModel: campaignModel,
                        template: campaignInvestmentT.investment,
                        thankYouView: view.investmentThankYou,
                        thankYouT: campaignInvestmentT.thankyou
                    });
                    i.render();
                    //app.views.campaign[id].render();
                    //app.cache[window.location.pathname] = app.views.campaign[id].$el.html();

                    app.hideLoading();
                });

            });
        },

        accountProfile: function() {
            requirejs(['models/user', 'views/user', ], (model, view, template) => {

                var i = new view.profile({
                    el: '#content',
                    model: app.user,
                    template: template.profile,
                });
                i.render();
                //app.views.campaign[id].render();
                app.cache[window.location.pathname] = i.$el.html();

                app.hideLoading();
            });
        },

        pageDetail: function(id) {
            requirejs(['models/page', 'views/page', ], (model, view, pageDetailT) => {

                let element = new model.model({
                    id: id
                });

                element.fetch({
                    success: (response) => {
                        app.models.page[id] = model;
                        app.views.page[id] = new view.detail({
                            el: '#content',
                            model: element,
                            template: pageDetailT,
                        });
                        app.views.page[id].render();
                        app.cache[window.location.pathname] = app.views.page[id].$el.html();

                        app.hideLoading();
                    }
                });
            });
        },

        mainPage: function(id) {
            requirejs(['models/page', 'views/page', ], (model, view, mainPageT) => {
                app.cache[window.location.pathname] = window.mainPage();
                $('#content').html(window.mainPage());
                app.hideLoading();
            });
        },

        login: function(id) {
            requirejs(['views/user', ], (userView, userT) => {
                let loginView = new userView.login({
                    el: '#content',
                    template: userT,
                })
                loginView.render();
                app.cache[window.location.pathname] = loginView.$el.html();
                app.hideLoading();
            });
        },

        logout: function(id) {
            // ToDo
            // Do we really want have to wait till user will be ready ?
            app.user.logout();
            app.on('userLogout', function() {
                window.location = '/';
            });
        },
    });

    app.routers = new appRoutes();

    app.user = new userModel();

    app.on('userReady', function(){
        app.user.url = serverUrl + Urls['rest_user_details']();
        require(['views/menu', ], (menu) => {
            app.menu = new menu.menu({
                el: '#menuList',
            });
            app.menu.render();

            /*app.profile = new menu.notification({
                el: '.header'
            });
            app.profile.render();*/

            app.notification = new menu.profile({
                el: '#menuProfile',
            });
            app.notification.render();
        });
        app.routers.navigate(
            window.location.pathname + '#',
            {trigger: true, replace: true}
        );
        console.log('user ready');
    });
    app.on('menuReady', function(){
        console.log('menu ready');
    });

    app.user.load();

    $('body').on('click', 'a', function(event) {
        var href = event.currentTarget.getAttribute('href');
        if(href.substr(0,1) != '#' && href.substr(0, 4) != 'http' && href.substr(0,3) != 'ftp') {
            event.preventDefault();
            app.showLoading();


            // If we already have that url in cache - we will just update browser location 
            // and set cache version of the page
            // overise we will trigger app router function
            var url = href;

            if(app.cache.hasOwnProperty(url) == false) {
                app.routers.navigate(
                    url, 
                    {trigger: true, replace: false}
                );
            } else {
                $('#content').html(app.cache[url]);
                app.routers.navigate(
                    url, 
                    {trigger: false, replace: false}
                );
                app.hideLoading();
            }
        }
    });


    Backbone.history.start({pushState: true});
});
});