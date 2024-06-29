import React, { useState } from 'react';

import Button from 'react-bootstrap/Button';

const DrawConsole = ({ initiateDraw, completeDraw, performUndo }) => {
  return (
    <div
      className="DrawbuttonContainer"
      style={{ padding: '5px', backgroundColor: 'white' }}
    >
      <div
        className="flexFirstRow"
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          padding: '5px',
        }}
      >
        <Button variant="dark" onClick={initiateDraw}>
          Draw
        </Button>
        &nbsp;
        <Button variant="dark" onClick={completeDraw}>
          Complete
        </Button>
      </div>
      <div
        className="flexSecondRow"
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          padding: '5px',
        }}
      >
        <Button onClick={performUndo}>Undo</Button>
      </div>
    </div>
  );
};

export default DrawConsole;
