document.getElementById("buildButton").onclick = function () { 
    
    var req = new XMLHttpRequest();
    req.open("GET", "/update", false);
    this.firstChild.data = "Building...";
    req.send(null);
    document.getElementById("time").firstChild.innerHTML = "Last Time Built: " + req.responseText;
    this.firstChild.data = "Build";
};




