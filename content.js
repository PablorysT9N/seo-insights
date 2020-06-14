chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.from === 'popup') {
        switch (message.subject) {
            case SUBJECT.SUMMARY:
                sendResponse(MetaInformation.GetGeneral());
                break;
            case SUBJECT.META:
                sendResponse({
                    'article': MetaInformation.GetArticle(),
                    'facebook': MetaInformation.GetFacebook(),
                    'opengraph': MetaInformation.GetOpenGraph(),
                    'others': MetaInformation.GetOthers(),
                    'parsely': MetaInformation.GetParsely(),
                    'twitter': MetaInformation.GetTwitter()
                });
                break;
            case SUBJECT.HEADING:
                var info = {
                    'heading': GetHeadings()
                };

                sendResponse(info);
                break;
            case SUBJECT.IMAGE:
                var info = {
                    'images': GetImages()
                };

                sendResponse(info);
                break;
            case SUBJECT.HYPERLINK:
                sendResponse(Hyperlinks.GetAll());
                break;
            case SUBJECT.FILE:
                var info = {
                    'stylesheet': FileInformation.GetStylesheetFiles(),
                    'javascript': FileInformation.GetJavaScriptFiles()
                };

                sendResponse(info);
                break;
        }
    }
});