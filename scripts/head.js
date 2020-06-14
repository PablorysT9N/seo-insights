/**
 * Module for Meta Information.
 */
var MetaInformation = (function() {

    /**
     * The known tags for the general meta information.
     * 
     * sources:
     *  - https://html.spec.whatwg.org/#the-title-element
     */
    var arrTagsGeneral = [
        'title'
    ];

    /**
     * The known names for the general meta information.
     * 
     * sources:
     *  - https://support.google.com/webmasters/answer/79812
     *  - https://html.spec.whatwg.org/#standard-metadata-names
     *  - https://www.bing.com/webmaster/help/which-robots-metatags-does-bing-support-5198d240
     */
    var arrMetaNamesGeneral = [
        'application-name',
        'author',
        'bingbot',
        'description',
        'generator',
        'google',
        'googlebot',
        'google-site-verification',
        'keywords',
        'msnbot',
        'rating',
        'referrer',
        'robots',
        'theme-color',
        'viewport'
    ];

    /**
     * The known properties for the Article meta information.
     * 
     * sources:
     *  - https://ogp.me/#type_article
     */
    var arrMetaPropertiesOpenGraphArticle = [
        'article:author',
        'article:expiration_time',
        'article:modified_time',
        'article:published_time',
        'article:section',
        'article:tag'
    ];

    /**
     * The known properties for the Facebook meta information.
     * 
     * sources:
     *  - https://developers.facebook.com/docs/applinks/metadata-reference/
     */
    var arrMetaPropertiesFacebook = [
        'al:ios:url',
        'al:ios:app_store_id',
        'al:ios:app_name',
        'al:iphone:url',
        'al:iphone:app_store_id',
        'al:iphone:app_name',
        'al:ipad:url',
        'al:ipad:app_store_id',
        'al:ipad:app_name',
        'al:android:url',
        'al:android:package',
        'al:android:class',
        'al:android:app_name',
        'al:windows_phone:url',
        'al:windows_phone:app_id',
        'al:windows_phone:app_name',
        'al:windows:url',
        'al:windows:app_id',
        'al:windows:app_name',
        'al:windows_universal:url',
        'al:windows_universal:app_id',
        'al:windows_universal:app_name',
        'al:web:url',
        'al:web:should_fallback'
    ];

    /**
     * The known properties for the OpenGraph meta information.
     * 
     * sources:
     *  - https://yoast.com/3-seo-quick-wins/
     */
    var arrMetaPropertiesOpenGraph = [
        'og:description',
        'og:image',
        'og:image:height',
        'og:image:width',
        'og:locale',
        'og:site_name',
        'og:title',
        'og:type',
        'og:url'
    ];

    /**
     * The known names for the Parse.ly meta information.
     * 
     * sources:
     *  - https://www.parse.ly/help/integration/metatags
     */
    var arrMetaNamesParsely = [
        'parsely-author',
        'parsely-image-url',
        'parsely-link',
        'parsely-metadata',
        'parsely-post-id',
        'parsely-pub-date',
        'parsely-section',
        'parsely-tags',
        'parsely-type',
        'parsely-title'
    ];

    /**
     * The known names for the Twitter meta information.
     * 
     * sources:
     *  - https://developer.twitter.com/en/docs/tweets/optimize-with-cards/overview/markup
     */
    var arrMetaNamesPropertiesTwitter = [
        'twitter:app:id:googleplay',
        'twitter:app:id:ipad',
        'twitter:app:id:iphone',
        'twitter:app:name:googleplay',
        'twitter:app:name:ipad',
        'twitter:app:name:iphone',
        'twitter:app:url:googleplay',
        'twitter:app:url:ipad',
        'twitter:app:url:iphone',
        'twitter:card',
        'twitter:creator',
        'twitter:creator:id',
        'twitter:description',
        'twitter:image',
        'twitter:image:alt',
        'twitter:player',
        'twitter:player:height',
        'twitter:player:stream',
        'twitter:player:width',
        'twitter:site',
        'twitter:site:id',
        'twitter:title'
    ];

    return {

        /**
         * Get the canonical url from meta information.
         */
        GetCanonical: function() {
            return $('head > link[rel="canonical"]').attr('href');
        },

        /**
         * Get the general meta information.
         */
        GetGeneral: function() {
            var info = new Object();

            //iterate through all the <meta> elements with name attribute.
            $('head > meta[name]').each(function() {
                var strMetaName = $(this).attr('name').trim().toLocaleLowerCase();

                //add the information of this <meta> element if known.
                if (arrMetaNamesGeneral.includes(strMetaName)) {
                    var strMetaValue = GetString($(this).attr('content')).trim();

                    //check if the value of the <meta> element is empty.
                    //in this case we don't have to add the value to the object.
                    if (strMetaValue === '') {
                        return;
                    }

                    //check if the property is already available.
                    //so it looks like a seconds <meta> element with same name already exists.
                    if (info.hasOwnProperty(strMetaName)) {

                        //decide to convert the property value to an array or add the value to the existing array.
                        if (Array.isArray(info[strMetaName])) {
                            info[strMetaName].push(strMetaValue);
                        } else {
                            info[strMetaName] = [info[strMetaName], strMetaValue];
                        }
                    } else {
                        info[strMetaName] = strMetaValue;
                    }
                }
            });

            //iterate through the general elements of the <head> element.
            for (var strGeneralTag of arrTagsGeneral) {
                var strTagValue = GetString($('head > ' + strGeneralTag).text()).trim();

                //check if the value of the general tag is empty.
                //in this case we don't have to add the value to the object.
                if (strTagValue === '') {
                    continue;
                }

                //add the value to the object.
                info[strGeneralTag] = strTagValue;
            }

            //get the canonical link of the site.
            info['canonical'] = GetString(this.GetCanonical()).trim();

            //return the general meta information.
            return info;
        },

        /**
         * Get the Facebook meta information.
         */
        GetFacebook: function() {
            var info = new Object();

            //iterate through the Facebook <meta> ekements of the <head> element.
            $('head > meta[property^="al:"]').each(function() {
                var strMetaName = $(this).attr('property').trim();

                //add the meta information if known.
                if (arrMetaPropertiesFacebook.includes(strMetaName)) {
                    info[strMetaName] = GetString($(this).attr('content'));
                }
            });

            //return the information.
            return info;
        },

        /**
         * Get the OpenGraph meta information.
         */
        GetOpenGraph: function() {
            var info = new Object();

            //iterate through the OpenGraph <meta> elements of the <head> element.
            $('head > meta[property^="og:"]').each(function() {
                var strMetaName = $(this).attr('property').trim();

                //add the meta information if known.
                if (arrMetaPropertiesOpenGraph.includes(strMetaName)) {
                    info[strMetaName] = GetString($(this).attr('content'));
                }
            });

            //return the information.
            return info;
        },

        /**
         * Get the Article meta information.
         */
        GetOpenGraphArticle: function() {
            var info = new Object();

            //iterate through the Article <meta> elements of the <head> element.
            $('head > meta[property^="article:"]').each(function() {
                var strMetaName = $(this).attr('property').trim();

                //add the meta information if known.
                if (arrMetaPropertiesOpenGraphArticle.includes(strMetaName)) {
                    info[strMetaName] = GetString($(this).attr('content'));
                }
            });

            //return the information.
            return info;
        },

        GetOthers: function() {
            var info = new Object();

            //iterate through all <meta> elements with name attribute.
            $('head > meta[name]').each(function() {
                var strMetaName = ($(this).attr('name') || '').toString();

                if (!arrMetaNamesGeneral.includes(strMetaName) && !arrMetaNamesParsely.includes(strMetaName) && !arrMetaNamesPropertiesTwitter.includes(strMetaName)) {
                    info[strMetaName] = GetString($(this).attr('content'));
                }
            });

            //iterate through all <meta> elements with property attribute.
            $('head > meta[property]').each(function() {
                var strMetaProperty = ($(this).attr('property') || '').toString();

                if (!arrMetaPropertiesOpenGraphArticle.includes(strMetaProperty) && !arrMetaPropertiesOpenGraph.includes(strMetaProperty) && !arrMetaPropertiesFacebook.includes(strMetaProperty) && !arrMetaNamesPropertiesTwitter.includes(strMetaProperty)) {
                    info[strMetaProperty] = GetString($(this).attr('content'));
                }
            });

            return info;
        },

        /**
         * Get the Parse.ly meta information.
         */
        GetParsely: function() {
            var info = new Object();

            //iterate through the Parse.ly <meta> elements of the <head> element.
            $('head > meta[name^="parsely-"]').each(function() {
                var strMetaName = $(this).attr('name').trim();

                //add the meta information if known.
                if (arrMetaNamesParsely.includes(strMetaName)) {
                    info[strMetaName] = GetString($(this).attr('content'));
                }
            });

            //return the information.
            return info;
        },

        /**
         * Get the Twitter meta information.
         */
        GetTwitter: function() {
            var info = new Object();

            //iterate through the Twitter <meta> elements of the <head> element.
            $('head > meta[name^="twitter:"]').each(function() {
                var strMetaName = ($(this).attr('name') || '').toString().trim();

                //add the meta information if known.
                if (arrMetaNamesPropertiesTwitter.includes(strMetaName)) {
                    info[strMetaName] = ($(this).attr('content') || '').toString().trim();
                }
            });

            /**
             * Open Graph protocol also specifies the use of property and content attributes for markup while Twitter cards use name and content. 
             * Twitter's parser will fall back to using property and content, so there is no need to modify existing Open Graph protocol markup if it already exists.
             * source: https://developer.twitter.com/en/docs/tweets/optimize-with-cards/guides/getting-started
             */

            //iterate through the Twitter <meta> elements of the <head> element.
            $('head > meta[property^="twitter:"]').each(function() {
                var strMetaProperty = ($(this).attr('property') || '').toString().trim();

                //add the meta information if known.
                if (arrMetaNamesPropertiesTwitter.includes(strMetaProperty)) {
                    info[strMetaProperty] = ($(this).attr('content') || '').toString().trim();
                }
            });

            //return the information.
            return info;
        }
    }
})();