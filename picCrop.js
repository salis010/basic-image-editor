var socket = io.connect();
var previewReader, fileReader;
var selectedFile;
var buffer;
var notification;
var image1, image2, image3, image4;
var canvas;
var ctx;
var img;
var mousePos;
var clipSize;
var xClip, yClip;       //top left position of clipped aread
var xOffset, yOffset;   //the distance between the pointer poistion and the top left corner of the clipped image
var mouseDownInClipArea;    //true if the mouse has been pressed in the clipped area

function init() {        
    
    notification = document.getElementById("notification");
    
    document.getElementById('FileBox').addEventListener('change', fileChosen);                
    document.getElementById('FileBox').addEventListener('click', chooseFileButtonPressed);                    
    document.getElementById("UploadButton").addEventListener('click', upload, false);
    
    previewReader = new FileReader();
    fileReader = new FileReader();
    
    canvas = document.getElementById("previewCanvas");
    canvas.addEventListener("mousedown", downhandler, false);
    canvas.addEventListener("mousemove", movehandler, false);
    canvas.addEventListener("mouseup", uphandler, false);
    ctx = canvas.getContext("2d");
    
    img = new Image();
    img.addEventListener("load", loadhandler, false);
    
    clipSize = 500;
    xClip = 0;
    yClip = 0;
    
    mouseDownInClipArea = false;
    
    socket.on('Upload Complete', function(msg) {
        //inform user that the upload was successful
    });    
}

function chooseFileButtonPressed() {
    notification.innerHTML = "";
}

function fileChosen(event) {        
    selectedFile = event.target.files[0];        
    
    if(selectedFile.type === "image/png" || selectedFile.type === "image/jpeg")
    {
        xClip = 0;
        yClip = 0;
        previewImage();        
    }
    else
    {
        notification.innerHTML = "Please choose either a 'jpg/jpeg' or 'png' image";
    }
}

function previewImage() {    
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    previewReader.onloadend = function(data) {        
        img.src = data.target.result;            
        
        img.onload = function() {};
    }
    previewReader.readAsDataURL(selectedFile);
}

function loadhandler() {
    console.log(img.naturalWidth + ", " + img.naturalHeight);
    
    canvas.setAttribute("width", img.naturalWidth);
    canvas.setAttribute("height", img.naturalHeight);
    ctx = canvas.getContext("2d");
    ctx.globalAlpha = 0.3;    
    
    ctx.save();
    ctx.drawImage(img, 0, 0);
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.rect(0, 0, clipSize, clipSize);
    ctx.clip();
    ctx.drawImage(img, 0, 0);    
    ctx.restore();
}

function upload() {        
    
    fileReader.onloadend = function(data) {
        buffer = fileReader.result;      
        socket.emit('upload', {'name': selectedFile.name, 'xClip': xClip, 'yClip': yClip, 'arrayBuffer': buffer});
    };
    
    fileReader.readAsArrayBuffer(selectedFile);
    
}

function downhandler(e) {
    
    mousePos = getMousePos(e);    
    
    if(mousePos.x - xClip > 0 && mousePos.x - xClip < clipSize
            && mousePos.y - yClip > 0 && mousePos.y - yClip < clipSize)
    {
        xOffset = mousePos.x - xClip;
        yOffset = mousePos.y - yClip;
        
        mouseDownInClipArea = true;
    }
}

function movehandler(e) {
    
    if(mouseDownInClipArea)
    {
        mousePos = getMousePos(e); 
        if(mousePos.x - xClip > 0 && mousePos.x - xClip < clipSize
            && mousePos.y - yClip > 0 && mousePos.y - yClip < clipSize)
        {
            xClip = mousePos.x - xOffset;
            yClip = mousePos.y - yOffset;

            if(xClip < 0)
            {
                xClip = 0;
                mouseDownInClipArea = false;
            }
            else if (xClip + clipSize > canvas.width)
            {
                xClip = canvas.width - clipSize;
                mouseDownInClipArea = false;
            }
            if(yClip < 0)
            {
                yClip = 0;
                mouseDownInClipArea = false;
            }
            else if (yClip + clipSize > canvas.height)
            {
                yClip = canvas.height - clipSize;
                mouseDownInClipArea = false;
            }

            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.globalAlpha = 0.3;
            ctx.drawImage(img, 0, 0);
            ctx.globalAlpha = 1;    

            ctx.beginPath();
            ctx.rect(xClip, yClip, clipSize, clipSize);
            ctx.clip();

            ctx.drawImage(img, 0, 0);
            ctx.restore();
            
        }
        else 
        {
            mouseDownInClipArea = false;
        }
    }
    
}

function uphandler(e) {
    mouseDownInClipArea = false;
}

function getMousePos(e) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
}


document.addEventListener("DOMContentLoaded", init, false);