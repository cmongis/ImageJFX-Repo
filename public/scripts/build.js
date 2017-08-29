document.getElementById("buildButton").onclick = function () { 
    
    var req = new XMLHttpRequest();
    req.open("GET", "/update", false);
    this.firstChild.data = "Building...";
    req.send(null);
    if (req.status === 200)
	document.getElementById("time").firstChild.innerHTML = "Last Time Built: " + req.responseText;
    else
	document.getElementById("time").firstChild.innerHTML = "Error building: " + req.status + " " + req.statusText;
    this.firstChild.data = "Build";
};




