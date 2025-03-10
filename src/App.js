import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import lisaAvatar from "./assets/avtar/lisa-avtar.png";

const App = () => {
  const [ messages, setMessages ] = useState([]);
  const [ isRecording, setIsRecording ] = useState(false);
  const [ loadingAnswer, setLoadingAnswer ] = useState(false);
  const [ userInput, setUserInput ] = useState("");
  const [ videoUrlFile, setVideoUrlFile ] = useState("");
  const chatContainerRef = useRef(null);
  const AZURE_OPENAI_CHATBOT_URL = "https://chatbot-api.ifour-consultancy.net";

  // Function to capture speech
  const startRecording = () => {
    const recognition = new window.webkitSpeechRecognition() || new window.SpeechRecognition();
    recognition.lang = "en-US";
    recognition.start();
    setIsRecording(true);

    recognition.onresult = async (event) => {
      const speechText = event.results[ 0 ][ 0 ].transcript;
      setIsRecording(false);
      recognition.stop();
      await processMessage(speechText);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
    };
  };

  // Function to send text or speech to backend
  const processMessage = async (text) => {
    if (!text.trim()) return;
    setUserInput("");


    setMessages((prev) => [ ...prev, { type: "user", text } ]);

    setLoadingAnswer(true);
    const response = await axios.post(AZURE_OPENAI_CHATBOT_URL + "/process-speech", { userText: text },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      },
    );

    if (response.data.status === "Succeeded") {
      setMessages((prev) => [
        ...prev,
        { type: "ai", text: response.data?.answer, jobId: response.data?.jobId, videoUrl: response.data?.videoFile },
      ]);
      setVideoUrlFile(response.data?.videoFile?.toString());
      setLoadingAnswer(false);
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [ messages ]);

  return (
    <div className="container mt-5 mb-5">

      <h2 className="text-center mb-3">AI Chat with Avatar</h2>

      <div className="chat-video-container">
        <div className="video-container">
          { videoUrlFile ? (
            <video
              src={ videoUrlFile }
              controls
              autoPlay
              onFocus={ false }
              playsInline
              style={ { width: "100%", height: "100%", objectFit: "cover" } }
            />
          ) :
            <img src={ lisaAvatar } width={ 'auto' } height={ 'auto' } alt="User Avatar" className="ms-2" /> }
        </div>

        <div className="card p-3 shadow-sm">
          <div className="chat-container" ref={ chatContainerRef }>
            <div className="chat-messages" >
              { messages.map((msg, index) => (
                <div key={ index } className={ `d-flex ${msg.type === "user" ? "justify-content-end" : "justify-content-start"} mb-3` }>
                  <div className={ `p-3 rounded ${msg.type === "user" ? "bg-success text-white" : "bg-primary text-white border"}` } style={ { maxWidth: "70%" } }>
                    { msg.text }
                    {/* { msg?.text && <p dangerouslySetInnerHTML={ { __html: msg?.text ? msg?.text?.replace(/\n\n/g, "<br><br>") : null } } /> } */ }
                  </div>
                </div>
              )) }
              { loadingAnswer && (
                <div className="d-flex justify-content-start mb-3">
                  <div className="p-3 rounded bg-light border" style={ { maxWidth: "70%" } }>
                    <span className="typing-dots">
                      <span>.</span>
                      <span>.</span>
                      <span>.</span>
                    </span>
                  </div>
                </div>
              ) }
            </div>

            <div className="input-group">
              <input
                type="text"
                className="form-control"
                value={ userInput }
                onChange={ (e) => setUserInput(e.target.value) }
              />
              <button className="btn btn-primary" onClick={ () => processMessage(userInput) }>Send</button>
              <button className="btn btn-danger" onClick={ startRecording } disabled={ isRecording }>
                { isRecording ? "🎤 Listening..." : "🎙 Speak" }
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default App;
