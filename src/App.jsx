import { useState, useRef, useEffect } from "react";
import "./App.css";

const App = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [trimmedVideoUrl, setTrimmedVideoUrl] = useState(null);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(10);
  const [brightness, setBrightness] = useState(1);
  const [saturation, setSaturation] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [videoDuration, setVideoDuration] = useState(0); // Initially set to 0, will be updated when video is loaded
  const [sliderValue, setSliderValue] = useState(0);

  const videoRef = useRef(null);
  const previewVideoRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(URL.createObjectURL(file));
      setSliderValue(0); // Reset the slider value when a new video is selected
    }
  };

  const trimVideo = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const mediaRecorder = new MediaRecorder(video.captureStream(), {
      mimeType: "video/webm",
    });
    const chunks = [];

    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      const trimmedUrl = URL.createObjectURL(
        new Blob(chunks, { type: "video/webm" })
      );
      setTrimmedVideoUrl(trimmedUrl);
    };

    mediaRecorder.start();
    video.currentTime = startTime;
    video.play();

    video.ontimeupdate = () => {
      if (video.currentTime >= endTime) {
        video.pause();
        mediaRecorder.stop();
      }
    };
  };

  const handleTimeChange = (e) => {
    const { name, value } = e.target;
    if (name === "start") setStartTime(Number(value));
    if (name === "end") setEndTime(Number(value));
  };

  const handleSliderChange = (e) => {
    const newSliderValue = e.target.value;
    setSliderValue(newSliderValue);

    // Update video current time based on slider value
    if (videoRef.current && videoDuration) {
      videoRef.current.currentTime = (newSliderValue / 100) * videoDuration;
    }

    // Update start and end times based on slider
    const newStartTime = (newSliderValue / 100) * videoDuration;
    setStartTime(newStartTime);
    setEndTime(newStartTime + 10); // Default end time is 10 seconds after start time
  };

  const saveTrimmedVideo = () => {
    if (trimmedVideoUrl) {
      const link = document.createElement("a");
      link.href = trimmedVideoUrl;
      link.download = "trimmed-video.webm";
      link.click();
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === "brightness") setBrightness(value);
    if (name === "saturation") setSaturation(value);
    if (name === "contrast") setContrast(value);
  };

  const videoStyles = {
    filter: `brightness(${brightness}) saturate(${saturation}) contrast(${contrast})`,
  };

  // Update the video duration when the video is loaded
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.onloadedmetadata = () => {
        setVideoDuration(videoRef.current.duration);
        setSliderValue(0); // Reset slider value when video is loaded
      };
    }
  }, [videoFile]);

  // Sync the slider with the video's current time while it's playing
  useEffect(() => {
    const updateSlider = () => {
      if (videoRef.current && videoDuration) {
        const currentTime = videoRef.current.currentTime;
        const value = (currentTime / videoDuration) * 100;
        setSliderValue(value);
      }
    };

    // Update slider every time the video plays
    const interval = setInterval(updateSlider, 100);

    // Clean up interval when the component unmounts or video changes
    return () => clearInterval(interval);
  }, [videoDuration]);

  // Sync preview video with slider
  useEffect(() => {
    if (previewVideoRef.current && videoDuration) {
      previewVideoRef.current.currentTime = (sliderValue / 100) * videoDuration;
    }
  }, [sliderValue, videoDuration]);

  return (
    <div className="app">
      <div className="content">
        <h1>Video Trim & Edit</h1>
        <input type="file" accept="video/*" onChange={handleFileChange} />
        {videoFile && (
          <div>
            <video
              ref={videoRef}
              src={videoFile}
              controls
              width="600"
              style={videoStyles}
            />
          </div>
        )}

        {/* Custom Slider */}
        <div className="slider-container">
          <input
            type="range"
            min="0"
            max="100"
            value={sliderValue} // Directly set slider value
            onChange={handleSliderChange}
            className="video-slider"
            disabled={videoDuration === 0} // Disable slider if no video loaded
            style={{ height: "100px" }} // Set slider height to 100px
          />

          {/* Preview Video inside Slider */}
          <div className="slider-video-preview" style={{ height: "100px" }}>
            {videoFile && (
              <video
                ref={previewVideoRef}
                src={videoFile}
                muted
                playsInline
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
          </div>
        </div>
        <div className="controls">
          <div>
            <label>Start Time (s):</label>
            <input
              type="number"
              name="start"
              value={startTime}
              onChange={handleTimeChange}
              min="0"
              max={videoDuration}
            />
          </div>
          <div>
            <label>End Time (s):</label>
            <input
              type="number"
              name="end"
              value={endTime}
              onChange={handleTimeChange}
              min={startTime}
              max={videoDuration}
            />
          </div>

          <button className="button" onClick={trimVideo}>
            ✂️ Trim Video
          </button>
        </div>

        <div className="video-edit-controls">
          <h3>Edit Video Filters</h3>
          <div>
            <label>Brightness:</label>
            <input
              type="range"
              name="brightness"
              min="0"
              max="2"
              step="0.01"
              value={brightness}
              onChange={handleFilterChange}
            />
          </div>
          <div>
            <label>Saturation:</label>
            <input
              type="range"
              name="saturation"
              min="0"
              max="2"
              step="0.01"
              value={saturation}
              onChange={handleFilterChange}
            />
          </div>
          <div>
            <label>Contrast:</label>
            <input
              type="range"
              name="contrast"
              min="0"
              max="2"
              step="0.01"
              value={contrast}
              onChange={handleFilterChange}
            />
          </div>
        </div>
      </div>

      <div className="side-panel">
        {trimmedVideoUrl && (
          <div>
            <h2>Trimmed & Edited Video</h2>
            <video
              src={trimmedVideoUrl}
              controls
              width="600"
              style={videoStyles}
            />
            <button className="button" onClick={saveTrimmedVideo}>
              Download Trimmed Video
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
