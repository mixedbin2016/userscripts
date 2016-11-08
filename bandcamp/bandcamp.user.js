// ==UserScript==
// @name        Bandcamp Download Button
// @namespace   bandcamp.com
// @description Add a download button to bandcamp.com tracks
// @include     *.bandcamp.com*
// @version     1.0.1
// @grant       none
// ==/UserScript==

(function(){
var check_include = function(incl){
    var regexp = new RegExp('/'+incl+'/');
    if(window.location.href.match()){
        return true;
    }
    return false;
};

var BandcampAlbum = function(albumdata){
    var Track = function(track, number, count){
        if(!track || !track.file){
            return false;
        }
        var url = window.location.protocol+track.file['mp3-128'];
        var title = track.title;
        var slug = title.toLowerCase().replace(/[^a-z0-9-_]/g, '-')
                    .replace(/[-]{2,*}/g, '-');
        if(count && count > 9){
            if((number+'').length<2){
                number = '0'+number;
            }
        }
        if(count && count > 99){
            if((number+'').length<3){
                number = '0'+number;
            }
        }
        var file = number+'_'+slug + '.mp3';
        var t = {
            'url': url,
            'file': file,
            'title': title
        };
        return t;
    };
    var Album = function(ad){
        var artist = ad.artist;
        var artist_slug = artist.toLowerCase().replace(/[^a-z0-9-_]/g, '-')
                    .replace(/[-]{2,*}/g, '-');
        var album = ad.current.title;
        var album_slug = album.toLowerCase().replace(/[^a-z0-9-_]/g, '-')
                    .replace(/[-]{2,*}/g, '-');
        var tracks = [];
        for(var i=0; i<albumdata.trackinfo.length; i++){
            var tr = albumdata.trackinfo[i];
            var track = new Track(tr, (i+1), albumdata.trackinfo.length);
            if(track){ tracks.push(track); }
        }
        return {
            'artist': artist,
            'album' : album,
            'artist_slug': artist_slug,
            'album_slug': album_slug,
            'tracks': tracks
        };
    };
    
    var album = new Album(albumdata);
    
    this.getObject = function(){
        return album;
    };
};

var add_download_button = function(album){
    var create_download_link = function(track){
        if(!track || !track.url){ return false; }
        var a = document.createElement('a');
        a.setAttribute('href', track.url);
        a.setAttribute('download', track.file);
        a.setAttribute('title', track.file);
        a.innerHTML = track.file; //track.title;
        return a;
    };
    for(var i=0; i<album.tracks.length; i++){
        var tr = album.tracks[i];
        var a = create_download_link(tr);
        if(a){
            var elem = jQuery('.track_row_view:nth-child('+(i+1)+')').
            find('td:last-child');
            elem.append(a);
        }
    }
};

var create_download_script = function(album){
    var s = '#!/bin/bash \n';
    for(var i=0; i<album.tracks.length; i++){
        var tr = album.tracks[i];
        if(tr && tr.title){
            tr.title = tr.title.replace("'", "`");
            album.artist = album.artist.replace("'", "`");
            album.album = album.album.replace("'", "`");
            s += '# '+tr.file+'\n';
            s += "curl --insecure -L -o '"+tr.file+"' '"+tr.url+"'; \n";
            s += "id3v2 --artist '"+album.artist+"' --album '"+album.album+"' "+
                "--song '"+tr.title+"' --track "+(i+1)+" '"+tr.file+"'; \n";
        }
    }
    return s;
};

if(!check_include('*.bandcamp.com/album/*')){
    return false;
}

if(typeof window.TralbumData!=='object' || window.TralbumData===null){
    return false;
}

jQuery(document).ready(function(){
    var bcAlbum = new BandcampAlbum(window.TralbumData).getObject();
    add_download_button(bcAlbum);
    try{ console.log(create_download_script(bcAlbum)); }catch(e){}
});

})();

