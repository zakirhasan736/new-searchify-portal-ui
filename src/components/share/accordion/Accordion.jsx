import React, {useState} from 'react'
import './accordion.css'
  export const Accordion = ({ id, question, answer }) => {
  const [isActive, setIsActive] = useState(false);
  return (
    <>
                    <div
        className="accordion_items"
        id={`faqs_accordion_${id}_wrapper`}
      >
        <div
          className="accordion-title"
          onClick={() => setIsActive(!isActive)}
          id={`faqs_accordion-${id}`}
        >
          <h3 className="accordion_title_text">
          {question}
          
          </h3>
          {isActive ? (
           <span>-</span>
          ) : (
            <span>+</span>
          )}
        </div>
        {isActive && (
          <div
            dangerouslySetInnerHTML={{ __html: answer }}
            className="accordion_desc"
          ></div>
        )}
      </div>
    </>
  )
}
