$(document).bind('ready', function() {

    //Resolvers that guess the image URL
    ImageResolver.register(new FileExtensionResolver());
    ImageResolver.register(new ImgurPageResolver());
    ImageResolver.register(new NineGagResolver());
    ImageResolver.register(new InstagramResolver());

    //Resolvers that need extra ajax requests
    ImageResolver.register(new ImgurAlbumResolver());
    ImageResolver.register(new FlickrResolver('a761e413a1b632086eb33a8a6aab3f98')); //Please don't use my api key!
    ImageResolver.register(new OpengraphResolver());
    ImageResolver.register(new WebpageResolver());

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

        Reddit.feed = 'http://www.reddit.com' + Reddit.subreddit + '.json?format=json&sort=new';

        $.ajax({
            dataType : 'jsonp',
            jsonp : 'jsonp',
            url : Reddit.feed,
            success : function(data, status, xhr) {
                Reddit.append(data);
            }
        });

        //Handle item selection
        $('#items').delegate('a','click', function(e) {
            e.preventDefault();

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

            $('#status').html('<a href="'+$(this).data('source')+'">'+$(this).data('title')+'</a>');

            //Scroll
            var position = $(this).position();
            var scroll = $('#items').scrollTop();
            var height = $('#items').height();
            //$('#items').scrollTop(scroll + position.top - height/2);
            $('#items').animate({
                scrollTop: scroll + position.top - height/2
            });

            Reddit.display(url);
        });

        //Next button (could certainly be refactored)
        $('#next').bind('click', function() {
            if (Reddit.$current) {
                var $next = Reddit.$current.parent('li').next().find('a');
                if ($next.length) {
                    Reddit.$current.removeClass('selected');
                    Reddit.$current = $next;
                    Reddit.$current.trigger('click');
                }
            }
        });

        //Previous button (could certainly be refactored)
        $('#prev').bind('click', function() {
            if (Reddit.$current) {
                var $prev = Reddit.$current.parent('li').prev().find('a');
                if ($prev.length) {
                    Reddit.$current.removeClass('selected');
                    Reddit.$current = $prev;
                    Reddit.$current.trigger('click');
                }
            }
        });

        $(document).bind('keydown', 'up', function(e) {
            $('#prev').trigger('click');
        });
        $(document).bind('keydown', 'down', function(e) {
            $('#next').trigger('click');
        });

        $('#details')
            .hammer({})
            .on('swipe', function(e) {
                if (e.direction === 'right') {
                    $('#prev').trigger('click');
                } else if (e.direction === 'left') {
                    $('#next').trigger('click');
                }
            });
    },

    display : function display(url) {
        ImageResolver.resolve(url, function imageResolved(image){
            if (image) {
                $('#details').html('<img src="' + image + '">');
            } else {
                $('#details').html('<a target="_blank" href="' + url.url + '">Link</a>');
            }
        });
    },

    loadMore : function(elem) {
        $("#status").html("<strong>Loading...</strong>");

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
                var a = $('<a/>');
                a.attr("href", items[i].data.url);
                a.data("source", "http://www.reddit.com" + items[i].data.permalink);
                a.data("title", items[i].data.title);
                a.html('<img width="70" src="' + items[i].data.thumbnail + '" alt=""> ' + items[i].data.title);

                var li = $('<li/>');
                li.append(a);

                fragment.appendChild(li[0]);
            }
            $("#items").append(fragment);
            $("#items").append('<li><a rel="next" href="'+Reddit.feed+'&amp;after=' + after +  '">Load more</a></li>');

            $("a[href='" + Reddit.first + "']").trigger('click');
        } else {
            alert("Error loading more");
        }
    }
};
