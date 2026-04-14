function ChatStage({ messages }) {
  return (
    <section className="chat-stage" aria-label="Conversation">
      <div className="messages">
        {messages.map((message, index) => (
          <article className={`message ${message.role}`} key={`${message.role}-${index}`}>
            <p className="message-label">{message.label}</p>
            <p>{message.text}</p>
          </article>
        ))}
        <div className="typing" aria-label="Jarvis is typing">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <form className="command-dock">
        <input
          aria-label="Command input"
          placeholder="Enter command or ask Jarvis anything..."
          type="text"
        />
        <button type="button" className="mic-btn">Mic</button>
        <button type="submit" className="send-btn">Send</button>
      </form>
    </section>
  )
}

export default ChatStage
