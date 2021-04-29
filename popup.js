//common information about the website.
let tabUrl = '';
let tabHostname = '';

//start the chrome extension and inject the scripts to the website.
//the injected scripts are used to get the needed information about the website.
(function() {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const tab = tabs[0];

		//set the common information about the website.
		tabUrl = tab.url;
    tabHostname = (new URL(tab.url)).hostname;

    //check whether it is possible to inject a content script to the current tab.
		//there are some protocols and sites where no content script can be injected.
    if (!CanInjectContentScript(tab)) {
      $('body').addClass('not-supported');
      return false;
    } else {
      $('body').removeClass('not-supported');
    }

    //programmatically inject the content scripts to the current tab.
    chrome.scripting.executeScript({files: ['libs/jquery-3.6.0.min.js'], target: {tabId: tab.id}});
    chrome.scripting.executeScript({files: ['scripts/helper.js'], target: {tabId: tab.id}});
    chrome.scripting.executeScript({files: ['scripts/dublincore.js'], target: {tabId: tab.id}});
    chrome.scripting.executeScript({files: ['scripts/opengraph.js'], target: {tabId: tab.id}});
    chrome.scripting.executeScript({files: ['scripts/head.js'], target: {tabId: tab.id}});
    chrome.scripting.executeScript({files: ['scripts/image.js'], target: {tabId: tab.id}});
    chrome.scripting.executeScript({files: ['scripts/heading.js'], target: {tabId: tab.id}});
    chrome.scripting.executeScript({files: ['scripts/link.js'], target: {tabId: tab.id}});
    chrome.scripting.executeScript({files: ['scripts/files.js'], target: {tabId: tab.id}});
    chrome.scripting.executeScript({files: ['content.js'], target: {tabId: tab.id}}, () => {
      chrome.tabs.sendMessage(tab.id, {source: SOURCE.POPUP, subject: SUBJECT.SUMMARY}, CallbackSummary);
    });
  });
})();

/**
 * Returns the state whether a content script can be injected into a tab.
 * @param {chrome.tabs.Tab} tab The tab which should be checked whether a content script can be injected.
 * @returns {boolean} The state whether a content script can be injected.
 */
function CanInjectContentScript(tab) {

	//it is not possible to inject content scripts to the chrome webstore.
	if (tab.url.startsWith('https://chrome.google.com/webstore')) {
		return false;
	}

	//it is possible to inject content scripts to url's with HTTP / HTTPS.
  return (tab.url.startsWith('http://') || tab.url.startsWith('https://'));
}

/**
 * Sets the count of table items to the card header.
 * @param {object} cardHeader The card header to set the count of table items.
 * @param {object} table The table container to get the count of items.
 */
function SetTableCountOnCardHeader(cardHeader, table) {
	const cntItems = $(table).find('tr').length;
	const cardHeaderButton = $(cardHeader).find('button');

	//first remove the info on the HTML element.
	$('span.info', cardHeaderButton).remove();

	//set the count of items to the card header.
	$(cardHeaderButton).append('<span class="info">' + cntItems + ' items</span>');
	$(cardHeaderButton).prop('disabled', (cntItems === 0));
}

/**
 * Resets all filter controls on the headings tab.
 */
function ResetHeadingFilter() {
	$('tr.filter td[id^="headings-h"]').each(function() {
		$(this).off('click');
		$(this).css('color', '#000');
	});
}

/**
 * Callback function of the heading filter items.
 * @param {object} event The event object.
 */
function CallbackHeadingFilter(event) {
	if ($('tr.level-h' + event.data.level).is(':hidden')) {
		$('tr.level-h' + event.data.level).show();
		$(this).css('color', '#000');
	} else {
		$('tr.level-h' + event.data.level).hide();
		$(this).css('color', '#ccc');
	}
}

/**
 * Replace all placeholder for translation with translated value.
 */
function TranslateHTML() {
	document.body.innerHTML = document.body.innerHTML.replace(/__MSG_(\w+)__/g, function(match, word) {
		return word ? chrome.i18n.getMessage(word) : '';
	});
}

/**
 * Helper function to display a image preview of a HTML element.
 * @param {string} hoverSelector The selector to the HTML element(s) to bind the hover event to.
 * @param {string} subSelector The selector to the sub HTML element to get the image path from.
 * @param {string} subAttribute The attribute name of the sub HTML element to get the image path from.
 */
function ShowImagePreview(hoverSelector, subSelector, subAttribute = null) {

	//bind the mouseenter and the mouseleave event.
	$(hoverSelector).on('mouseenter', function() {
		$('body div.img-preview').remove();

		//get the value of the given attribute name as image path.
		//the attribute name is not required so the value of the sub HTML element can also be used as image path.
		if (subAttribute) {
			$('body').append('<div class="img-preview"><img src="' + $(subSelector, this).attr(subAttribute) + '"></div>');
		} else {
			$('body').append('<div class="img-preview"><img src="' + $(subSelector, this).text() + '"></div>');
		}
	}).on('mouseleave', function() {
		$('body div.img-preview').remove();
	});
}





function GetTextWordInformation(strValue, newLine = false) {
    strValue = (strValue || '').toString().trim();

    //don't create information for empty string values.
    if (strValue.length === 0) {
        return '';
    }

    //create the tags for information about characters and words.
    var strCharsHTML = '<span class="info">' + strValue.length + ' ' + chrome.i18n.getMessage('chars') + '</span>';
    var strWordsHTML = '<span class="info">' + GetWordCount(strValue) + ' ' + chrome.i18n.getMessage('words') + '</span>';

    //return the tags with information.
    return ((newLine === true) ? '<br>' : '') + strCharsHTML + strWordsHTML;
}

function GetHeaderInformation(url) {
    $('table#info-headers > tbody').empty();
    fetch(url).then(function(response) {
        for (var p of response.headers.entries()) {
            $('table#info-headers > tbody').append(GetInformationRow(p[0], p[1]));
        }

        $('table#info-headers > tbody').append(GetInformationRow('HTTP Status', response.status));
        $('table#info-headers > tbody').append(GetInformationRow('HTTP Version', response.statusText.trim() === '' ? 'HTTP/2' : 'HTTP/1'));
    });
}

function GetInformationRow(strValueColumn1, strValueColumn2) {
    return '<tr><td>' + strValueColumn1 + '</td><td>' + strValueColumn2 + '</td></tr>';
}

/**
 * function to get a row with formatted color value(s).
 *
 * @param {string} metaName The name of the meta element.
 * @param {string|string[]} metaValue The value of the meta element or an array of values.
 * @returns {string} The row with information of the meta element (value formatted as color).
 */
function GetColorRow(metaName, metaValue) {

    if (typeof metaValue === 'string') {
        metaValue = [metaValue];
    }

    if (Array.isArray(metaValue) && metaValue.length > 0) {
        var htmlColorValue = '';

        for (let colorValue of metaValue) {
					let convertColor = '';

					if (colorValue.startsWith('rgba') || colorValue.startsWith('rgb')) {
						convertColor = rgb2hex(colorValue);
					} else {
						convertColor = colorValue;
					}

					htmlColorValue += '<div class="theme-color" style="background: ' + colorValue + '; color: ' + invertColor(convertColor, true) + '">' + colorValue + '</div>';
        }

        return GetInformationRow(metaName, htmlColorValue);
    }
}





function GetDefaultRow(metaName, metaValue) {
    var arrDetailedInfo = ['title', 'description', 'og:description', 'og:title', 'twitter:description', 'twitter:title'];
    var strMetaValueHTML = '';

    if (Array.isArray(metaValue) && metaValue.length > 0) {

        //escape the HTML of the meta value so HTML tags are visible.
        for (indexValue = 0; indexValue < metaValue.length; indexValue++) {
            metaValue[indexValue] = EscapeHTML(metaValue[indexValue]);
        }

        //format multiple values as list.
        if (metaValue.length > 1) {
            strMetaValueHTML = '<ul><li>' + metaValue.join('</li><li>') + '</li></ul>';
        } else {
            strMetaValueHTML = metaValue;
        }
    } else {
        strMetaValueHTML = metaValue;
    }

    if (arrDetailedInfo.includes(metaName)) {
        return GetInformationRow(metaName + GetTextWordInformation(metaValue, true), strMetaValueHTML);
    } else {
        return GetInformationRow(metaName, strMetaValueHTML);
    }
}
function GetCanonicalRow(metaName, metaValue) {
    if (metaValue.selfref === true) {
        return GetInformationRow(metaName + '<br><span class="info">self-referential</span>', EscapeHTML(metaValue.value));
    } else {
        return GetInformationRow(metaName, EscapeHTML(metaValue.value));
    }
}
function GetGeneratorRow(metaName, metaValue) {
    if (Array.isArray(metaValue)) {

        //escape the HTML of the meta value so HTML tags are visible.
        for (indexValue = 0; indexValue < metaValue.length; indexValue++) {
            metaValue[indexValue] = EscapeHTML(metaValue[indexValue]);
        }

        //format multiple values as list.
        if (metaValue.length > 1) {
            strMetaValue = '<ul>';
            metaValue.forEach(meta => {
                strMetaValue += '<li>' + GetGeneratorLink(meta) + '</li>';
            });
            strMetaValue += '</ul>';
        } else {
            strMetaValue = GetGeneratorLink(metaValue);
        }
    } else {
        strMetaValue = GetGeneratorLink((metaValue || '').toString());
    }

    return GetInformationRow(metaName, strMetaValue);
}

/**
 * function to get the link to the generator website.
 * @param {string} name The generator name to get the link of the generator website.
 * @return {string} The link to the generator website or the generator name itself.
 */
function GetGeneratorLink(name) {

    //define the keywords of the generator to get the link to the generator website.
    let arrGeneratorLinks = [
        ['chimpify', 'https://www.chimpify.de/'],
        ['drupal', 'https://www.drupal.de/'],
        ['ghost', 'https://ghost.org/'],
				['hexo', 'https://hexo.io/'],
        ['hubspot', 'https://www.hubspot.de/products/cms'],
        ['hugo', 'https://gohugo.io/'],
        ['jekyll', 'https://jekyllrb.com/'],
        ['joomla', 'https://www.joomla.org/'],
        ['mediawiki', 'https://www.mediawiki.org/wiki/MediaWiki'],
        ['publii', 'https://getpublii.com/'],
        ['typo3', 'https://typo3.org/'],
        ['vbulletin', 'https://www.vbulletin.com/'],
        ['wordpress', 'https://wordpress.org/'],
        ['woocommerce', 'https://woocommerce.com/']
    ];

    //get the link to the generator based on the name.
    var arrFoundLinks = arrGeneratorLinks.filter(item => name.toLowerCase().includes(item[0]));

    //check if there is a found link to the generator website.
    //the link is only used if it is the only one found in the array.
    if (arrFoundLinks.length === 1) {
        return '<a href="' + arrFoundLinks[0][1] + '" target="_blank">' + name + '</a>';
    } else {
        return name;
    }
}


function CallbackSummary(meta) {
  //clear the table because we refresh this table here with current values.
  $('table#meta-head-info > tbody').empty();

  window.scrollTo(0, 0);

  //iterate through all the elements of the <head> element.
  for (let strMetaName in meta) {
      switch (strMetaName) {
          case 'canonical':
              $('table#meta-head-info > tbody').append(GetCanonicalRow(strMetaName, meta[strMetaName]));
              break;
          case 'generator':
              $('table#meta-head-info > tbody').append(GetGeneratorRow(strMetaName, meta[strMetaName]));
              break;
          case 'theme-color':
              $('table#meta-head-info > tbody').append(GetColorRow(strMetaName, meta[strMetaName]));
              break;
          default:
              $('table#meta-head-info > tbody').append(GetDefaultRow(strMetaName, meta[strMetaName]));
              break;
      }
  }
}


jQuery(function() {

	//translate all placeholder of the extension.
	TranslateHTML();

  function GroupByName(objects) {
    let arr = [];
    for (let obj of objects) {

      arrFiltered = arr.filter(objItem => objItem.name === obj.name);
      if (arrFiltered.length === 1)  {
        arrFiltered[0].value.push(obj.value);
      } else {
        arr.push({'name': obj.name, 'value': [obj.value]});
      }
    }
    return arr;
  }

    //init
    if ($('body').hasClass('not-supported') === false) {

      $('a[href="#view-summary"]').on('click', function() {
        chrome.tabs.query({
          active: true,
          currentWindow: true
      }, tabs => {
          chrome.tabs.sendMessage(
              tabs[0].id,
              {source: SOURCE.POPUP, subject: SUBJECT.SUMMARY},
              CallbackSummary
          );
      });
      });

        $('a[href="#view-meta"]').on('click', function() {
            chrome.tabs.query({
                active: true,
                currentWindow: true
            }, tabs => {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    {source: SOURCE.POPUP, subject: SUBJECT.META},
                    data
                );
            });

            const data = info => {
                window.scrollTo(0, 0);

                //clear all meta tables.
                $('table[id^=meta-details-] > tbody').empty();

                var objMetaFacebook = info['facebook'];
                var objMetaOpenGraph = info['opengraph'];
                let objMetaOpenGraphArticle = info['opengraph-article'];
                let objMetaOpenGraphAudio = info['opengraph-audio'];
                let objMetaOpenGraphBook = info['opengraph-book'];
                let objMetaOpenGraphImage = info['opengraph-image'];
                let objMetaOpenGraphProfile = info['opengraph-profile'];
                let objMetaOpenGraphVideo = info['opengraph-video'];
                var objMetaOthers = info['others'];
                var objMetaParsely = info['parsely'];
                var objMetaTwitter = info['twitter'];
                var objMetaDublinCore = info['dublin-core'];

                var arrDetailedInfoOpenGraph = ['og:title', 'og:description'];
                var arrDetailedInfoTwitter = ['twitter:title', 'twitter:description', 'twitter:image:alt'];

                for (let tagOthers of objMetaOthers) {
                    var strOthersValue = (tagOthers.value || '').toString().trim();
                    $('table#meta-details-others > tbody').append(GetInformationRow(tagOthers.name, EscapeHTML(strOthersValue)));
                }

                for (let infoOpenGraphArticle of GroupByName(objMetaOpenGraphArticle)) {
                    var strArticleValue = (infoOpenGraphArticle.value.join('; ') || '').toString().trim();
                    $('table#meta-details-opengraph-article > tbody').append(GetInformationRow(infoOpenGraphArticle.name, EscapeHTML(strArticleValue)));
                }

                for (let tagInfoAudio of objMetaOpenGraphAudio) {
                  const value = (tagInfoAudio.value || '').toString().trim();
                  $('table#meta-details-opengraph-audio > tbody').append(GetInformationRow(tagInfoAudio.name, EscapeHTML(value)));
                }

                for (let tagInfoBook of objMetaOpenGraphBook) {
                  const value = (tagInfoBook.value || '').toString().trim();
                  $('table#meta-details-opengraph-book > tbody').append(GetInformationRow(tagInfoBook.name, EscapeHTML(value)));
                }

                for (let tagInfoImage of objMetaOpenGraphImage) {
                  const value = (tagInfoImage.value || '').toString().trim();
                  $('table#meta-details-opengraph-image > tbody').append(GetInformationRow(tagInfoImage.name, EscapeHTML(value)));
                }

                for (let tagInfoProfile of objMetaOpenGraphProfile) {
                  const value = (tagInfoProfile.value || '').toString().trim();
                  $('table#meta-details-opengraph-profile > tbody').append(GetInformationRow(tagInfoProfile.name, EscapeHTML(value)));
                }

                for (let tagInfoVideo of objMetaOpenGraphVideo) {
                  const value = (tagInfoVideo.value || '').toString().trim();
                  $('table#meta-details-opengraph-video > tbody').append(GetInformationRow(tagInfoVideo.name, EscapeHTML(value)));
                }

                for (let tagFacebook of objMetaFacebook) {
                    var strFacebookValue = (tagFacebook.value || '').toString().trim();
                    $('table#meta-details-facebook > tbody').append(GetInformationRow(tagFacebook.name, EscapeHTML(strFacebookValue)));
                }

                for (let tagParsely of objMetaParsely) {
                    var strParselyValue = (tagParsely.value || '').toString().trim();
                    $('table#meta-details-parsely > tbody').append(GetInformationRow(tagParsely.name, EscapeHTML(strParselyValue)));
                }

                for (let strTwitterName in objMetaTwitter) {
                    var strTwitterValue = (objMetaTwitter[strTwitterName] || '').toString().trim();
                    var strAdditionalInfoHTML = '';

                    //get the additional information if needed.
                    if (arrDetailedInfoTwitter.includes(strTwitterName)) {
                        strAdditionalInfoHTML = GetTextWordInformation(strTwitterValue, true);
                    }

                    //set the Twitter information to the table.
                    $('table#meta-details-twitter > tbody').append(GetInformationRow(strTwitterName + strAdditionalInfoHTML, EscapeHTML(strTwitterValue)));
                }

                for (let infoOpenGraph of objMetaOpenGraph) {
                    var strOpenGraphValue = (infoOpenGraph.value || '').toString().trim();
                    var strAdditionalInfoHTML = '';

                    //get the additional information if needed.
                    if (arrDetailedInfoOpenGraph.includes(infoOpenGraph.name)) {
                        strAdditionalInfoHTML = GetTextWordInformation(strOpenGraphValue, true);
                    }

                    //set the OpenGraph information to the table.
                    $('table#meta-details-opengraph-basic > tbody').append(GetInformationRow(infoOpenGraph.name + strAdditionalInfoHTML, EscapeHTML(strOpenGraphValue)));
                }

                if (Object.keys(objMetaOpenGraph).length > 0) {

                    //The four required properties for every page are: og:title, og:type, og:image, og:url
                    //https://ogp.me/
                    for (itemRequiredOpenGraph of ['og:title', 'og:type', 'og:image', 'og:url']) {
                      if (objMetaOpenGraph.filter(infoOpenGraph => infoOpenGraph.name === itemRequiredOpenGraph).length === 0) {
                        $('table#meta-details-errors > tbody').append('<tr><td>Missing required Open Graph information: ' + itemRequiredOpenGraph + '.</td></tr>');
                      }
                    }
                }

                for (let tagDublinCore of objMetaDublinCore) {
                    var strDublinCoreValue = (tagDublinCore.value || '').toString().trim();
                    $('table#meta-details-dublin-core > tbody').append(GetInformationRow(tagDublinCore.name, EscapeHTML(strDublinCoreValue)));
                }

                //now all lists are created so it is possible to count the items of each list.
								SetTableCountOnCardHeader($('#meta-details-opengraph-heading'), $('div#meta-details-opengraph-content'));
                SetTableCountOnCardHeader($('#meta-opengraph-basic-heading'), $('table#meta-details-opengraph-basic'));
                SetTableCountOnCardHeader($('#meta-opengraph-article-heading'), $('table#meta-details-opengraph-article'));
                SetTableCountOnCardHeader($('#meta-opengraph-audio-heading'), $('table#meta-details-opengraph-audio'));
                SetTableCountOnCardHeader($('#meta-opengraph-book-heading'), $('table#meta-details-opengraph-book'));
                SetTableCountOnCardHeader($('#meta-opengraph-image-heading'), $('table#meta-details-opengraph-image'));
                SetTableCountOnCardHeader($('#meta-opengraph-profile-heading'), $('table#meta-details-opengraph-profile'));
                SetTableCountOnCardHeader($('#meta-opengraph-video-heading'), $('table#meta-details-opengraph-video'));
                SetTableCountOnCardHeader($('#meta-details-facebook-heading'), $('table#meta-details-facebook'));
                SetTableCountOnCardHeader($('#meta-details-twitter-heading'), $('table#meta-details-twitter'));
                SetTableCountOnCardHeader($('#meta-details-dublin-core-heading'), $('table#meta-details-dublin-core'));
                SetTableCountOnCardHeader($('#meta-details-parsely-heading'), $('table#meta-details-parsely'));
                SetTableCountOnCardHeader($('#meta-details-others-heading'), $('table#meta-details-others'));
                SetTableCountOnCardHeader($('#meta-details-errors-heading'), $('table#meta-details-errors'));
            }
        });

        //Headings
        $('a[href="#view-headings"]').on('click', ViewHeadings);

        //Images
        $('a[href="#view-images"]').on('click', ViewImages);

        //Hyperlinks
        $('a[href="#view-hyperlinks"]').on('click', ViewHyperlinks);

        //Files
        $('a[href="#view-files"]').on('click', ViewFiles);

        //Headers
        $('a[href="#view-headers"]').on('click', ViewHeader);

        $('a[href="#view-tools"]').on('click', ViewTools);
    }
});


function ViewHeader() {
    GetHeaderInformation(tabUrl);
}

/**
 * View for Tools.
 */
function ViewTools() {
	window.scrollTo(0, 0);

    //get the table of the tools list.
	const objTableTools = $('div#view-tools table#info-tools');

    //remove all available tools.
    objTableTools.children('tbody').empty();
	objTableTools.children('tbody').append(GetToolsItem(chrome.i18n.getMessage('tools_pagespeed_insights_title'), chrome.i18n.getMessage('tools_pagespeed_insights_description'), 'https://developers.google.com/speed/pagespeed/insights/?url=' + encodeURIComponent(tabUrl)));
	objTableTools.children('tbody').append(GetToolsItem(chrome.i18n.getMessage('tools_w3c_css_validation_title'), chrome.i18n.getMessage('tools_w3c_css_validation_description'), 'https://jigsaw.w3.org/css-validator/validator?uri=' + encodeURIComponent(tabUrl)));
	objTableTools.children('tbody').append(GetToolsItem(chrome.i18n.getMessage('tools_nu_html_checker_title'), chrome.i18n.getMessage('tools_nu_html_checker_description'), 'https://validator.w3.org/nu/?doc=' + encodeURIComponent(tabUrl)));
	objTableTools.children('tbody').append(GetToolsItem(chrome.i18n.getMessage('tools_gtmetrix_title'), chrome.i18n.getMessage('tools_gtmetrix_description'), 'https://gtmetrix.com/?url=' + encodeURIComponent(tabUrl)));
	objTableTools.children('tbody').append(GetToolsItem(chrome.i18n.getMessage('tools_gsc_rich_results_title'), chrome.i18n.getMessage('tools_gsc_rich_results_description'), 'https://search.google.com/test/rich-results?url=' + encodeURIComponent(tabUrl)));
	objTableTools.children('tbody').append(GetToolsItem(chrome.i18n.getMessage('tools_gsc_mobile_friendly_title'), chrome.i18n.getMessage('tools_gsc_mobile_friendly_description'), 'https://search.google.com/test/mobile-friendly?url=' + encodeURIComponent(tabUrl)));
}

/**
 * function to get the tool item to display on the list of the tool view.
 * @param {string} title The title of the tool.
 * @param {string} description The description of the tool.
 * @param {string} link The link to the tool website with website specific parameter.
 */
function GetToolsItem(title, description, link) {
    return '<tr><td><a class="full-link" href="' + link + '" target="_blank"><div class="heading">' + title + '</div><span class="info">' + description + '</span></a></td></tr>';
}

/**
 * View for Files.
 */
function ViewFiles() {

    //get the current / active tab of the current window and send a message
    //to the content script to get the information from website.
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        chrome.tabs.sendMessage(
            tabs[0].id,
            {source: SOURCE.POPUP, subject: SUBJECT.FILE},
            fnResponse
        );
    });

    //define and execute the callback function called by the content script.
    const fnResponse = objFiles => {
        var objTableStylesheet = $('div#view-files table#files-stylesheet');
        var objTableJavaScript = $('div#view-files table#files-javascript');
        var objTableSpecialFiles = $('div#view-files table#files-special');
				let objTableStylesheetDomains = $('div#view-files table#list-files-javascript-domains');
				let objTableJavaScriptDomains = $('div#view-files table#list-files-stylesheet-domains')

        //get the arrays with files.
        var arrStylesheet = objFiles['stylesheet'];
        var arrJavaScript = objFiles['javascript'];

        //remove all rows of the stylesheet and javascript table.
        objTableStylesheet.children('tbody').empty();
        objTableJavaScript.children('tbody').empty();
        objTableSpecialFiles.children('tbody').empty();
				objTableStylesheetDomains.children('tbody').empty();
				objTableJavaScriptDomains.children('tbody').empty();

        window.scrollTo(0, 0);

				let domainsJavaScript = [];
				let domainsStylesheet = [];

        //iterate through the stylesheet files and add them to the table.
        for (let indexStylesheet = 0; indexStylesheet < arrStylesheet.length; indexStylesheet++) {
					let stylesheetDomain = new URL(arrStylesheet[indexStylesheet].url.href).host;

					//just add the domain to the array if the domain doesn't exists.
					if (stylesheetDomain.trim() !== '') {
						domainsStylesheet.push(stylesheetDomain);
					}

					let htmlMedia = '';

					if (arrStylesheet[indexStylesheet].media.trim() !== '') {
						htmlMedia = '<span class="info"><strong>media: </strong>' + arrStylesheet[indexStylesheet].media + '</span>';
					}

					//add the stylesheet url to the list.
					objTableStylesheet.children('tbody').append('<tr><td id="item-' + indexStylesheet + '"><a href="' + arrStylesheet[indexStylesheet].url.href + '" target="_blank">' + arrStylesheet[indexStylesheet].original + '</a>' + htmlMedia + '</td></tr>');
        }

        //iterate through the javascript files and add them to the table.
        for (let indexJavaScript = 0; indexJavaScript < arrJavaScript.length; indexJavaScript++) {
					let javascriptDomain = new URL(arrJavaScript[indexJavaScript].url.href).host;

					if (javascriptDomain.trim() !== '') {
						domainsJavaScript.push(javascriptDomain);
					}

					let htmlAsync = ''

					if (arrJavaScript[indexJavaScript].is_async === true) {
						htmlAsync = '<span class="info"><strong>async</strong></span>';
					}

					//add the javascript url to the list.
					objTableJavaScript.children('tbody').append('<tr><td id="item-' + indexJavaScript + '"><a href="' + arrJavaScript[indexJavaScript].url.href + '" target="_blank">' + arrJavaScript[indexJavaScript].original + '</a>' + htmlAsync + '</td></tr>');
        }

				for (let domainStylesheet of domainsStylesheet.filter((v, i, a) => a.indexOf(v) === i).sort()) {
					if (domainStylesheet.trim() !== '') {
						$('table#list-files-stylesheet-domains').children('tbody').append('<tr><td>' + domainStylesheet + '</td><td>' + domainsStylesheet.filter(domain => domain === domainStylesheet).length + '</td></tr>');
					}
				}

				for (let domainJavaScript of domainsJavaScript.filter((v, i, a) => a.indexOf(v) === i).sort()) {
					if (domainJavaScript.trim() !== '') {
						$('table#list-files-javascript-domains').children('tbody').append('<tr><td>' + domainJavaScript + '</td><td>' + domainsJavaScript.filter(domain => domain === domainJavaScript).length + '</td></tr>');
					}
				}

        var strSitemapURL = (new URL(tabUrl)).origin + '/sitemap.xml';
        fetch(strSitemapURL).then(function(response) {
            if (response.status == 200) {
                $('div#view-files table#files-special tbody').append('<tr><td id="item-sitemapxml"><a href="' + strSitemapURL + '" target="_blank">sitemap.xml</a></td></tr>');
                SetTableCountOnCardHeader($('#special-heading'), $('table#files-special'));
            }
        });

        var strRobotsURL = (new URL(tabUrl)).origin + '/robots.txt';
        fetch(strRobotsURL).then(function(response) {
            if (response.status == 200) {
                $('div#view-files table#files-special tbody').append('<tr><td id="item-robotstxt"><a href="' + strRobotsURL + '" target="_blank">robots.txt</a></td></tr>');
                SetTableCountOnCardHeader($('#special-heading'), $('table#files-special'));
            }
        });

        //set the count of items to the card header.
        SetTableCountOnCardHeader($('#stylesheet-heading'), $('table#files-stylesheet'));
        SetTableCountOnCardHeader($('#javascript-heading'), $('table#files-javascript'));
    };
}

/**
 * View for Headings.
 */
function ViewHeadings() {

    //get the current / active tab of the current window and send a message
    //to the content script to get the information from website.
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        chrome.tabs.sendMessage(
            tabs[0].id,
            {source: SOURCE.POPUP, subject: SUBJECT.HEADING},
            fnResponse
        );
    });

    //define and execute the callback function called by the content script.
    const fnResponse = arrHeadings => {
        var objTableHeadings = $('div#view-headings table#list-headings');
        var objTableStatsHeadings = $('div#view-headings table#statistics-headings');
				var objTableErrorsHeadings = $('table#headings-errors');

        //remove all rows of the headings table.
        objTableHeadings.children('tbody').empty();
				objTableErrorsHeadings.children('tbody').empty();
        window.scrollTo(0, 0);

				//reset the filter on the heading tab.
				ResetHeadingFilter();

        //iterate through the different levels of headings.
        for (level = 1; level <= 6; level++) {
            objTableStatsHeadings.find('td[id="headings-h' + level + '"]').text(arrHeadings.filter(heading => heading.type === 'h' + level).length);

            //set events to toggle hide and show of the headings on click.
            $('td[id="headings-h' + level + '"]').on('click', {'level': level}, CallbackHeadingFilter);
        }

				//check whether there are multiple h1 headings.
				if (arrHeadings.filter(heading => heading.type === 'h1').length > 1) {
					objTableErrorsHeadings.children('tbody').append('<tr><td>Multiple H1 headings found on website.</td></tr>');
				}

        //set the total count of headings to the table.
        objTableStatsHeadings.find('td[id="headings-all"]').text(arrHeadings.length);

				//add all found headings to the table.
        for (itemHeading of arrHeadings) {
            var strTableRow = '<tr class="level-' + itemHeading.type + ' is-empty"><td><span>' + itemHeading.type + '</span>' + itemHeading.text + GetTextWordInformation(itemHeading.text, true) + '</td></tr>';
            $(objTableHeadings).children('tbody').append(strTableRow);
        }

				//set the count of found errors and warnings.
				SetTableCountOnCardHeader($('#headings-errors-heading'), $('table#headings-errors'));
    };
}

function GetImageInfo(objImageInfo, strID) {
    let strImageInfo = '';

    if (objImageInfo.alt !== '') {
        strImageInfo = strImageInfo + '<span class="info"><strong>alt:</strong> ' + objImageInfo.alt + '</span>';
    }

    if (objImageInfo.title !== '') {
        strImageInfo = strImageInfo + '<span class="info"><strong>title:</strong> ' + objImageInfo.title + '</span>';
    }

    if (objImageInfo.src) {
        let img = new Image;
        img.onload = function() {
            $('tr#' + strID + ' td').append('<span class="info"><strong>size:</strong> ' + img.width + ' x ' + img.height + '</span>');
        };
        img.src = objImageInfo.src;
    }

    return strImageInfo;
}

/**
 * View for Images.
 */
function ViewImages() {

    //get the current / active tab of the current window and send a message
    //to the content script to get the information from website.
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        chrome.tabs.sendMessage(
            tabs[0].id,
            {source: SOURCE.POPUP, subject: SUBJECT.IMAGE},
            fnResponse
        );
    });

    //define and execute the callback function called by the content script.
    const fnResponse = arrImages => {
        var objTableImages = $('div#view-images table#list-images');
        var objTableStatsImages = $('div#view-images table#statistics-images');
				var objTableDomains = $('div#view-images table#list-image-domains');

        let indexImage = 0;

        //remove all rows of the images table.
        objTableImages.children('tbody').empty();
        window.scrollTo(0, 0);

				let domains = [];

        //run through all images of the array with a source value.
        for (let itemImage of arrImages.filter(image => image.src !== '')) {
					indexImage++;

					let imageDomain = new URL(itemImage.src).host;

					if (imageDomain.trim() !== '') {
						domains.push(imageDomain);
					}

					objTableImages.children('tbody').append('<tr id="img' + indexImage + '"><td><a target="_blank" href="' + itemImage.src + '">' + ((itemImage.filename) ? itemImage.filename : itemImage.src) + '</a>' + GetImageInfo(itemImage, 'img' + indexImage) + '</td></tr>');
        }

				for (let domainImage of domains.filter((v, i, a) => a.indexOf(v) === i).sort()) {
					objTableDomains.children('tbody').append('<tr><td>' + domainImage + '</td><td>' + domains.filter(domain => domain === domainImage).length + '</td></tr>');
				}

        //set the statistics for the images.
        objTableStatsImages.find('td[data-seo-info="images-all"]').text(arrImages.length);
        objTableStatsImages.find('td[data-seo-info="images-without-alt"]').text(arrImages.filter(image => image.alt === '').length);
        objTableStatsImages.find('td[data-seo-info="images-without-src"]').text(arrImages.filter(image => image.src === '').length);
        objTableStatsImages.find('td[data-seo-info="images-without-title"]').text(arrImages.filter(image => image.title === '').length);

				//bind the image preview to the images.
				ShowImagePreview('table#list-images td', 'a', 'href');
    };
}

/**
 * View for Hyperlinks.
 */
function ViewHyperlinks() {

    //get the current / active tab of the current window and send a message
    //to the content script to get the information from website.
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        chrome.tabs.sendMessage(
            tabs[0].id,
            {source: SOURCE.POPUP, subject: SUBJECT.HYPERLINK},
            fnResponse
        );
    });

    //define and execute the callback function called by the content script.
    const fnResponse = objHyperlinks => {
        var objTableHyperlinks = $('div#view-hyperlinks table#list-hyperlinks');
        var objTableAlternate = $('div#view-hyperlinks table#list-hyperlink-alternate');
        var objTableStatsHyperlinks = $('div#view-hyperlinks table#statistics-hyperlinks');
        var objTableStatsProtocols = $('div#view-hyperlinks table#statistics-protocols');
				var objTableDomains = $('div#view-hyperlinks table#list-hyperlink-domains');
				var objTablePreload = $('div#view-hyperlinks table#list-hyperlink-preload');
				var objTableDnsPrefetch = $('div#view-hyperlinks table#list-hyperlink-dns-prefetch');

        //remove all rows of the hyperlinks table.
        objTableHyperlinks.children('tbody').empty();
        objTableAlternate.children('tbody').empty();
				objTableDomains.children('tbody').empty();
				objTablePreload.children('tbody').empty();
				objTableDnsPrefetch.children('tbody').empty();

        var arrHyperlinks = objHyperlinks['links'];
        var arrAlternate = objHyperlinks['alternate'];
				var arrPreload = objHyperlinks['preload'];
				var arrDnsPrefetch = objHyperlinks['dnsprefetch'];

        window.scrollTo(0, 0);

				let domains = [];

        //iterate through the hyperlinks and add them to the table.
        for (let itemHyperlink of arrHyperlinks) {
            var strRelativeInfo = '';
            var strTitleInfo = '';

            if ((itemHyperlink.rel || '').toString().trim() !== '') {
                strRelativeInfo = '<span class="info"><strong>rel:</strong> ' + (itemHyperlink.rel || '').toString().trim() + '</span>';
            }

            if ((itemHyperlink.title || '').toString().trim() !== '') {
                strTitleInfo = '<span class="info"><strong>title:</strong> ' + (itemHyperlink.title || '').toString().trim() + '</span>';
            }

						let hyperlinkDomain = new URL(itemHyperlink.url.href).host;

						if (hyperlinkDomain.trim() !== '') {
							domains.push(hyperlinkDomain);
						}

            objTableHyperlinks.children('tbody').append('<tr><td><a target="_blank" href="' + itemHyperlink.url.href + '">' + itemHyperlink.url.href + '</a>' + strRelativeInfo + strTitleInfo + '</td></tr>');
					}

        for (let domainHyperlink of domains.filter((v, i, a) => a.indexOf(v) === i).sort()) {
						objTableDomains.children('tbody').append('<tr><td>' + domainHyperlink + '</td><td>' + domains.filter(domain => domain === domainHyperlink).length + '</td></tr>');
					}

					for (let objPreload of arrPreload) {
						objTablePreload.children('tbody').append('<tr><td>' + objPreload.href + '</td></tr>');
					}

					for (let objDnsPrefetch of arrDnsPrefetch) {
						objTableDnsPrefetch.children('tbody').append('<tr><td>' + objDnsPrefetch.href + '</td></tr>');
					}

        for (let objAlternateItem of arrAlternate) {
            var strTitleInfo = '';
            var strLangInfo = '';

            if ((objAlternateItem.title || '').toString().trim() !== '') {
                strTitleInfo = '<span class="info"><strong>title:</strong> ' + (objAlternateItem.title || '').toString().trim() + '</span>';
            }

            if ((objAlternateItem.hreflang || '').toString().trim() !== '') {
                strLangInfo = '<span class="info"><strong>lang:</strong> ' + (objAlternateItem.hreflang || '').toString().trim() + '</span>';
            }

            objTableAlternate.children('tbody').append('<tr><td><a href="' + objAlternateItem.href + '" target="_blank">' + objAlternateItem.href + '</a>' + strTitleInfo + strLangInfo + '</td></tr>');
        }

        //set the statistics for the hyperlinks.
        objTableStatsHyperlinks.find('td[data-seo-info="hyperlinks-all"]').text(arrHyperlinks.map(link => link.count).reduce((a, b) => a + b, 0));
        objTableStatsHyperlinks.find('td[data-seo-info="hyperlinks-all-unique"]').text(arrHyperlinks.length);
        objTableStatsHyperlinks.find('td[data-seo-info="hyperlinks-internal"]').text(arrHyperlinks.filter(link => link.internal === true).map(link => link.count).reduce((a, b)=> a + b, 0));
        objTableStatsHyperlinks.find('td[data-seo-info="hyperlinks-internal-unique"]').text(arrHyperlinks.filter(link => link.internal === true).length);
        objTableStatsHyperlinks.find('td[data-seo-info="hyperlinks-external"]').text(arrHyperlinks.filter(link => link.internal === false).map(link => link.count).reduce((a, b)=> a + b, 0));
        objTableStatsHyperlinks.find('td[data-seo-info="hyperlinks-external-unique"]').text(arrHyperlinks.filter(link => link.internal === false).length);

        //set the statistics for the protocols of the hyperlinks.
        objTableStatsProtocols.find('td[data-seo-info="hyperlinks-protocol-http"]').text(arrHyperlinks.filter(link => link.url.protocol === 'http').map(link => link.count).reduce((a, b)=> a + b, 0));
        objTableStatsProtocols.find('td[data-seo-info="hyperlinks-protocol-https"]').text(arrHyperlinks.filter(link => link.url.protocol === 'https').map(link => link.count).reduce((a, b)=> a + b, 0));
        objTableStatsProtocols.find('td[data-seo-info="hyperlinks-protocol-mailto"]').text(arrHyperlinks.filter(link => link.url.protocol === 'mailto').map(link => link.count).reduce((a, b)=> a + b, 0));
        objTableStatsProtocols.find('td[data-seo-info="hyperlinks-protocol-javascript"]').text(arrHyperlinks.filter(link => link.url.protocol === 'javascript').map(link => link.count).reduce((a, b)=> a + b, 0));
        objTableStatsProtocols.find('td[data-seo-info="hyperlinks-protocol-whatsapp"]').text(arrHyperlinks.filter(link => link.url.protocol === 'whatsapp').map(link => link.count).reduce((a, b)=> a + b, 0));
        objTableStatsProtocols.find('td[data-seo-info="hyperlinks-protocol-tel"]').text(arrHyperlinks.filter(link => link.url.protocol === 'tel').map(link => link.count).reduce((a, b) => a + b, 0));
    };
}
