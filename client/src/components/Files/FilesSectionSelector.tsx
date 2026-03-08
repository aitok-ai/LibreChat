import React from 'react';
import { Button } from '../ui';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLocalize } from '~/hooks';

export default function FilesSectionSelector() {
  const navigate = useNavigate();
  const location = useLocation();
  const localize = useLocalize();
  const vectorStoresLabel = 'Vector Stores';
  let selectedPage = '/vector-stores';

  if (location.pathname.includes('vector-stores')) {
    selectedPage = '/vector-stores';
  }
  if (location.pathname.includes('files')) {
    selectedPage = '/files';
  }

  const darkButton = { backgroundColor: 'black', color: 'white' };
  const lightButton = { backgroundColor: '#f9f9f9', color: 'black' };

  return (
    <div className="flex h-12 w-52 flex-row justify-center rounded border bg-white p-1">
      <div className="flex w-2/3 items-center pr-1">
        <Button
          className="w-full rounded rounded-lg border"
          style={selectedPage === '/vector-stores' ? darkButton : lightButton}
          onClick={() => {
            selectedPage = '/vector-stores';
            navigate('/d/vector-stores');
          }}
        >
          {vectorStoresLabel}
        </Button>
      </div>
      <div className="flex w-1/3 items-center">
        <Button
          className="w-full rounded rounded-lg border"
          style={selectedPage === '/files' ? darkButton : lightButton}
          onClick={() => {
            selectedPage = '/files';
            navigate('/d/files');
          }}
        >
          {localize('com_ui_files')}
        </Button>
      </div>
    </div>
  );
}
