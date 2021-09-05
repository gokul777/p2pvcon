const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const content = document.getElementById("content");
const myPeer = new Peer(undefined, {
  host: "/",
  port: "443",
  secure: true,
});
const myVideo = document.createElement("video");
myVideo.muted = true;
const peers = {};
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    addVideoStream(myVideo, stream);

    myPeer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });
  });

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
});

myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
}

function addVideoStream(video, stream) {
  const userTag = document.createElement("p");
  userTag.classList.add("user");
  const node = document.createTextNode(stream.id);
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    userTag.appendChild(node);
    video.play();
  });
  content.append(userTag);
  content.append(video);
  videoGrid.append(content);
}
