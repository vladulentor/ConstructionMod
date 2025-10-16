if (navigator.userAgent && typeof screen != "undefined" && screen.width) {
    var isAndroid12 = navigator.userAgent.includes("Android 12"),
        isOneOfSamsungDevices = navigator.userAgent.includes("SM-");

    if (isAndroid12 && isOneOfSamsungDevices) {
        var content = "user-scalable=no, width=" + screen.width;
        if (document.querySelector) {
            var viewport = document.querySelector("meta[name=viewport]");
            viewport.setAttribute("content", content);
        } else {
            addMeta("viewport", content);
        }
    }
}