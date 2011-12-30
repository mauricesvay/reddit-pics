$(document).bind('ready', function() {
    Reddit.init();
});

var Reddit = {
    $current : null,
    subreddit : '/r/pics/',
    feed : null,
    first : null,
    
    init: function() {
    
        Reddit.feed = 'http://www.reddit.com' + Reddit.subreddit + '.json?format=json';
    
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
            
            if (url.match(/(png|jpg|jpeg|gif)$/i)) {
                $('#details').html('<img src="' + url + '">');
            } else {
                //Try to be clever by resolving imgur images
                var matches = url.match(/http:\/\/imgur.com\/(.*)/) || [];
                if (matches.length && (-1 === matches[1].indexOf('/'))) {
                    url = 'http://i.imgur.com/' + matches[1] + '.jpg';
                    $('#details').html('<img src="' + url + '">');
                } else {
                    $('#details').html('<iframe src="' + url + '"></iframe>');
                }
            }
            $('#status').html('<a href="'+$(this).data('source')+'">'+$(this).data('title')+'</a>');
            
            //Scroll
            var position = $(this).position();
            var scroll = $('#items').scrollTop();
            var height = $('#items').height();
            //$('#items').scrollTop(scroll + position.top - height/2);
            $('#items').animate({
                scrollTop: scroll + position.top - height/2
            })
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
        
        $(document).bind('keydown', 'up', function() {$('#prev').trigger('click')});
        $(document).bind('keydown', 'down', function() {$('#next').trigger('click')});
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
                if (i == 0) {
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
}
