document.getElementById("buildButton").onclick = function () { 
    
    this.firstChild.data = "Building...";
    var req = new XMLHttpRequest();
    req.open("GET", "/update", false);
    
    req.send(null);
    document.getElementById("time").firstChild.innerHTML = req.responseText;
    this.firstChild.data = "Build";
};




