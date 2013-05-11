$(document).bind('ready', function() {

    //Resolvers that guess the image URL
    ImageResolver.register(new FileExtensionResolver());
    ImageResolver.register(new ImgurPageResolver());
    ImageResolver.register(new NineGagResolver());
    ImageResolver.register(new InstagramResolver());

    //Resolvers that need extra ajax requests
    ImageResolver.register(new ImgurAlbumResolver());
    ImageResolver.register(new FlickrResolver('6a4f9b6d16c0eaced089c91a2e7e87ad')); //Please don't use my api key!
    ImageResolver.register(new OpengraphResolver());
    ImageResolver.register(new WebpageResolver());
    ImageResolver.register({
        resolve: function(url, clbk) {
            clbk('http://screenshot.etf1.fr/?url=' + encodeURIComponent(url));
        }
    });

    //Some jQuery code to make the demo work
    //Use a crossdomain proxy (required by some plugins)
    $.ajaxPrefilter('text', function(options) {
        options.url = "http://furious-stream-4406.herokuapp.com?src=" + encodeURIComponent(options.url);
    });

    Reddit.init();
});

var Reddit = {
    $current : null,
    subreddit : '/r/pics/new/',
    feed : null,
    first : null,

    init: function() {
        Reddit.bindEvents();
        Reddit.start();
    },

    start: function() {
        $('.items').empty();
        $('.details').empty();

        Reddit.feed = 'http://www.reddit.com' + Reddit.subreddit + '.json?format=json&sort=new';

        $.ajax({
            dataType : 'jsonp',
            jsonp : 'jsonp',
            url : Reddit.feed,
            success : function(data, status, xhr) {
                Reddit.append(data);
            },
            error : function() {
                alert("Couldn't load feed");
            }
        });
    },

    bindEvents: function() {
        //Handle item selection
        $('.items').delegate('a','click', function(e) {
            e.preventDefault();
            Reddit.startLoading();

            var $target = $(e.currentTarget);
            var url = $target.attr('href');

            //Is this a load more link ?
            if ('next' == $target.attr('rel')) {
                Reddit.loadMore($target);
                return;
            }

            if (Reddit.$current) {
                Reddit.$current.removeClass('selected');
            }
            $target.addClass('selected');
            Reddit.$current = $target;

            //Scroll
            var position = $(this).position();
            var scroll = $('.items').scrollLeft();
            var width = $('.items').width();
            $('.items').scrollLeft(scroll + position.left - width/2);

            Reddit.display(url, $(this).data('title'), $(this).data('source'));

            //Preload next
            var $next = Reddit.$current.parent().next().children('a');
            if ('next' !== $next.attr('rel')) {
                Reddit.preload($next.attr('href'));
            }
        });

        $(document).bind('keydown', 'left', function(e) {
            Reddit.goToPrev();
        });
        $(document).bind('keydown', 'right', function(e) {
            Reddit.goToNext();
        });

        $('.details')
            .hammer({})
            .on('swipe', function(e) {
                if (e.direction === 'right') {
                    Reddit.goToPrev();
                } else if (e.direction === 'left') {
                    Reddit.goToNext();
                }
            })
            .on('tap', function(e){
                Reddit.goToNext();
            });

        $('.subreddit-selector').on('change', function(){
            Reddit.subreddit = $(this).val();
            if (Reddit.subreddit === 'other') {
                Reddit.subreddit = window.prompt("Enter a subreddit", "/r/pics");
            }
            Reddit.start();
        });
    },

    goToNext : function() {
        if (Reddit.$current) {
            var $next = Reddit.$current.parent('li').next().find('a');
            if ($next.length) {
                Reddit.$current.removeClass('selected');
                Reddit.$current = $next;
                Reddit.$current.trigger('click');
            }
        }
    },

    goToPrev : function() {
        if (Reddit.$current) {
            var $prev = Reddit.$current.parent('li').prev().find('a');
            if ($prev.length) {
                Reddit.$current.removeClass('selected');
                Reddit.$current = $prev;
                Reddit.$current.trigger('click');
            }
        }
    },

    startLoading : function startLoading() {
        $(".status").html("<strong>Loading...</strong>");
        $('.details').html('');
    },

    endLoading : function endLoading() {
        $(".status").html("");
        return;
    },

    preload : function preload(url) {
        ImageResolver.resolve(url, function imageResolved(image){
            // console.log('Preload ' + image);
            var img = document.createElement('img');
            img.src = image;
        });
    },

    display : function display(url, title, source) {
        ImageResolver.resolve(url, function imageResolved(image){
            Reddit.endLoading();
            if (Reddit.$current.attr('href') !== url) {
                // async result doesn't match current selected item
                // result arriving too late ?
                return;
            }
            if (image) {
                $('.details').html('<img src="' + image + '">');
            } else {
                $('.details').html('<a target="_blank" href="' + url + '">Link</a>');
            }
            $('.status').html('<a href="' + source + '">' + title + '</a>');
        });
    },

    loadMore : function(elem) {
        $(".status").html("<strong>Loading...</strong>");

        var placeholder = elem.parent('li');
        var url = elem.attr('href');

        $.ajax({
            dataType : 'jsonp',
            jsonp : 'jsonp',
            url : url,
            success : function(data, status, xhr) {
                Reddit.append(data, placeholder);
            }
        });
    },

    append : function(data, placeholder) {
        var items = data.data.children;
        var all = [];
        var after = data.data.after;

        if (items.length) {
            if (placeholder) {
                $(placeholder).remove();
            }

            var fragment = document.createDocumentFragment();

            for (var i=0,l=items.length; i<l; i++) {
                if (i === 0) {
                    Reddit.first = items[i].data.url;
                }
                console.log(items[i]);
                var a = $('<a/>');
                a.attr("href", items[i].data.url);
                a.data("source", "http://www.reddit.com" + items[i].data.permalink);
                a.data("title", items[i].data.title);

                if (!items[i].data.thumbnail.match('http://')) {
                    items[i].data.thumbnail = 'default.png';
                }

                a.html('<img width="70" src="' + items[i].data.thumbnail + '" alt="">');

                var li = $('<li/>');
                li.append(a);

                fragment.appendChild(li[0]);
            }
            $(".items").append(fragment);
            $(".items").append('<li><a rel="next" href="'+Reddit.feed+'&amp;after=' + after +  '">Load more</a></li>');

            $("a[href='" + Reddit.first + "']").trigger('click');
        } else {
            alert("Error loading more");
        }
    }
};
