import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

const ModelContent = ({ onClose, sendLabelToApp }) => {
  const [label, setLabel] = useState('');
  return (
    // <div
    //   className="modal"
    //   style={{
    //     position: 'fixed',
    //     display: 'block',
    //     top: '50%',
    //     left: '50%',
    //     transform: 'translate(-50%, -50%)',
    //   }}
    // >
    //   <div>
    //     <label>
    //       Label:{' '}
    //       <input
    //         name="label-input"
    //         type="text"
    //         value={label}
    //         onChange={(e) => setLabel(e.target.value)}
    //       />
    //     </label>
    //   </div>
    //   <button onClick={() => sendLabelToApp(label)}>Save</button>
    //   <button onClick={onClose}>Close</button>
    // </div>
    <>
      <Modal show={true}>
        <Modal.Header closeButton>
          <Modal.Title>Update Label</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <label>
            Label:{' '}
            <input
              name="label-input"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </label>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={() => sendLabelToApp(label)}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ModelContent;
