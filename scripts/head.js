
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

		function IsOpenGraphTag(name) {
			const isOpenGraphArticle = OpenGraph.GetArticleTagsInfo().findIndex(tag => tag.name === name) > -1;
			const isOpenGraphAudio = OpenGraph.GetAudioTagsInfo().findIndex(tag => tag.name === name) > -1;
			const isOpenGraphBasic = OpenGraph.GetBasicTagsInfo().findIndex(tag => tag.name === name) > -1;
			const isOpenGraphBook = OpenGraph.GetBookTagsInfo().findIndex(tag => tag.name === name) > -1;
			const isOpenGraphImage = OpenGraph.GetImageTagsInfo().findIndex(tag => tag.name === name) > -1;
			const isOpenGraphProfile = OpenGraph.GetProfileTagsInfo().findIndex(tag => tag.name === name) > -1;
			const isOpenGraphVideo = OpenGraph.GetVideoTagsInfo().findIndex(tag => tag.name === name) > -1;

			return isOpenGraphArticle || isOpenGraphAudio || isOpenGraphBasic || isOpenGraphBook || isOpenGraphImage || isOpenGraphProfile || isOpenGraphVideo;
		};

    return {

        /**
         * Get the canonical url from meta information.
         */
        GetCanonical: function() {
            return ($('head > link[rel="canonical"]').attr('href') || '').toString();
        },

        GetHeadings: function() {

            let itemsHeading = [];

            $('body h1, body h2, body h3, body h4, body h5, body h6').each(function() {
                itemsHeading.push({
                    'type': $(this).prop('tagName').toLocaleLowerCase(),
                    'title': $(this).text()
                });
            });
        },

        GetMetaCharacterEncoding: function() {

            let itemsCharacterEncoding = [];

            $('head > meta[charset]').each(function() {
                itemsCharacterEncoding.push({
                    'name': 'charset',
                    'value': $(this).attr('charset')
                });
            });
        },

        GetPragmaDirectives: function() {

            let itemsPragmaDirective = [];

            $('head > meta[http-equiv]').each(function() {
                itemsPragmaDirective.push({
                    'name': $(this).attr('http-equiv').trim().toLocaleLowerCase(),
                    'value': $(this).attr('content')
                });
            });
        },

        GetMetaElements: function() {

            //array to store the information of the <meta> elements.
            let itemsMetaElement = [];

            //iterate through all the <meta> elements with name or property attribute.
            $('head > meta[name], head > meta[property]').each(function() {

                //add the <meta> element with name attribute to the array.
                if ($(this).is('[name]')) {
                    itemsMetaElement.push({
                        'name': $(this).attr('name').trim().toLocaleLowerCase(),
                        'value': $(this).attr('content')
                    });
                }

                //add the <meta> element with property attribute to the array.
                if ($(this).is('[property]')) {
                    itemsMetaElement.push({
                        'name': $(this).attr('property').trim().toLocaleLowerCase(),
                        'value': $(this).attr('content')
                    });
                }
            });
        },

        /**
         * Get the general meta information.
         */
        GetGeneral: function() {
					let items = [];

            //iterate through all the <meta> elements with name attribute.
            $('head > meta[name]').each(function() {
							var strMetaName = $(this).attr('name').trim().toLocaleLowerCase();

							//add the information of this <meta> element if known.
							if (arrMetaNamesGeneral.includes(strMetaName)) {
								var strMetaValue = ($(this).attr('content') || '').toString().trim();

								//check if the value of the <meta> element is empty.
								//in this case we don't have to add the value to the object.
								if (strMetaValue === '') {
										return;
								}

								items.push({
									'name': strMetaName,
									'value': strMetaValue
								});
                }
            });

						$('html[lang]').each(function() {
							const lang = ($(this).attr('lang') || '').toString().trim();
							items.push({
								'name': 'lang',
								'value': lang
							});
						});

            //iterate through the general elements of the <head> element.
            for (var strGeneralTag of arrTagsGeneral) {
                var strTagValue = ($('head > ' + strGeneralTag).text() || '').toString().trim();

                //check if the value of the general tag is empty.
                //in this case we don't have to add the value to the object.
                if (strTagValue === '') {
                    continue;
                }

								items.push({
									'name': strGeneralTag,
									'value': strTagValue
								});
            }

            //get the canonical link of the site.
            try {
                let objCanonicalUrl = new URL(MetaInformation.GetCanonical().trim());
                let objCurrentSiteUrl = new URL(GetBaseUrl());

								items.push({
									'name': 'canonical',
									'value': objCanonicalUrl.href
								});
            } catch(_) { }

            //return the general meta information.
            return items;
        },

        GetDublinCore: function() {
					let tags = [];

					$('head > meta[name]').filter(function() {
						return ($(this).attr('name').toUpperCase().startsWith('DC.') || $(this).attr('name').toUpperCase().startsWith('DCTERMS.'));
					}).each(function() {
						tags.push({
							'name': ($(this).attr('name') || '').toString().trim(),
							'value': ($(this).attr('content') || '').toString().trim()
						});
					});

          return tags;
        },

        GetOthers: function() {
					let tags = [];

            //iterate through all <meta> elements with name attribute.
            $('head > meta[name]').each(function() {
                var strMetaName = ($(this).attr('name') || '').toString();
								var strMetaProperty = ($(this).attr('property') || '').toString();

								if (strMetaName.trim().toUpperCase().startsWith('DC.') || strMetaName.trim().toUpperCase().startsWith('DCTERMS.')) {
									return;
								}

								if (strMetaName.trim().toLowerCase().startsWith('twitter:')) {
									return;
								}

								if (strMetaName.trim().toLowerCase().startsWith('parsely-')) {
									return;
								}

                if (!IsOpenGraphTag(strMetaName) && !arrMetaNamesGeneral.includes(strMetaName)) {
									tags.push({name: strMetaName, value: ($(this).attr('content') || '').toString()});
                }
            });

            //iterate through all <meta> elements with property attribute.
            $('head > meta[property]').each(function() {
                var strMetaProperty = ($(this).attr('property') || '').toString();

								if (strMetaProperty.trim().toLowerCase().startsWith('twitter:')) {
									return;
								}

                //add the unknown meta information to the object.
                if (!IsOpenGraphTag(strMetaProperty)) {
									tags.push({name: strMetaProperty, value: ($(this).attr('content') || '').toString()});
                }
            });

						$('head > meta[http-equiv]').each(function() {
							var strMetaHttpEquiv = ($(this).attr('http-equiv') || '').toString();
							tags.push({name: strMetaHttpEquiv, value: ($(this).attr('content') || '').toString()});
						});

						$('head > meta[charset]').each(function() {
							var strMetaCharset = ($(this).attr('charset') || '').toString();
							tags.push({name: 'charset', value: strMetaCharset});
						});


            return tags;
        },

        /**
         * Get the Parse.ly meta information.
         */
        GetParsely: function() {
					let tags = [];

					$('head > meta[name]').filter(function() {
						return $(this).attr('name').toLowerCase().trim().startsWith('parsely-');
					}).each(function() {
						tags.push({
							'name': ($(this).attr('name') || '').toString().trim(),
							'value': ($(this).attr('content') || '').toString().trim()
						});
					});

            //return the information.
            return tags;
        },

        /**
         * Get the Twitter meta information.
         */
        GetTwitter: function() {
					let tags = [];

					$('head > meta[name]').filter(function() {
						return $(this).attr('name').toLowerCase().trim().startsWith('twitter:');
					}).each(function() {
						tags.push({
							'name': ($(this).attr('name') || '').toString().trim(),
							'value': ($(this).attr('content') || '').toString().trim()
						});
					});

					$('head > meta[property]').filter(function() {
						return $(this).attr('property').toLowerCase().trim().startsWith('twitter:');
					}).each(function() {
						tags.push({
							'name': ($(this).attr('property') || '').toString().trim(),
							'value': ($(this).attr('content') || '').toString().trim()
						});
					});

            //return the information.
            return tags;
        },

        GetMetaAlternate: function() {
            var info = [];

            //iterate through the <meta> elements of the <head> element with alternate.
            $('head > link[rel="alternate"]').each(function() {
                info.push({
                    'title': ($(this).attr('title') || '').toString().trim(),
                    'href': ($(this).attr('href') || '').toString().trim(),
                    'hreflang': ($(this).attr('hreflang') || '').toString().trim()
                });
            });

            return info;
        },

				GetMetaPreload: function() {
					var info = [];

					$('head > link[rel="preload"]').each(function() {
						info.push({
							'href': ($(this).attr('href') || '').toString().trim(),
							'as': ($(this).attr('as') || '').toString().trim(),
							'type': ($(this).attr('type') || '').toString().trim()
						});
					});

					return info;
				},

				GetMetaDnsPrefetch: function() {
					var info = [];

					$('head > link[rel="dns-prefetch"]').each(function() {
						info.push({
							'href': ($(this).attr('href') || '').toString().trim()
						});
					});

					return info;
				},

				GetMetaPreconnect: function() {
					var info = [];

					$('head > link[rel="preconnect"]').each(function() {
						info.push({
							'href': ($(this).attr('href') || '').toString().trim()
						});
					});

					return info;
				}
    }
})();
