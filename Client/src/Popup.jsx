import React, { useEffect, useState } from 'react'

export default function Popup() {
  const [detect, setDetect] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    setStatus('requesting')
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'GET_LAST_DETECT' }, (resp) => {
          setDetect(resp && resp.lastDetect ? resp.lastDetect : null)
          setStatus('done')
        })
      } else {
        // Not running inside extension (dev server)
        setStatus('dev-mode')
        setDetect(null)
      }
    } catch (err) {
      console.error('Popup message error', err)
      setStatus('error')
    }
  }, [])

  return (
    <div className="popup-root">
      <h2>Hotel & Airbnb Price Comparator</h2>
      <div className="status">Status: {status}</div>
      {detect ? (
        <div className="detect">
          <div><strong>Site:</strong> {detect.site}</div>
          <div><strong>Title:</strong> {detect.title}</div>
          <div><strong>Location:</strong> {detect.location}</div>
          <div><strong>Price:</strong> {detect.price}</div>
        </div>
      ) : (
        <div className="nodetect">No detection available yet.</div>
      )}
    </div>
  )
}
