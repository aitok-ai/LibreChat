import React from 'react';
import VectorStoreSidePanel from './VectorStore/VectorStoreSidePanel';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { useLocalize } from '~/hooks';
import { Button } from '../ui';

const FileDashboardView = () => {
  const params = useParams();
  const navigate = useNavigate();
  const localize = useLocalize();
  return (
    <div className="bg-[#f9f9f9] p-0 lg:p-7">
      <div className="mt-3 ml-3 flex flex-row justify-between">
        {params.vectorStoreId && (
          <Button
            className="block lg:hidden"
            variant={'outline'}
            size={'sm'}
            onClick={() => {
              navigate('/d');
            }}
          >
            {localize('com_ui_go_back')}
          </Button>
        )}
      </div>
      <div className="flex h-screen max-w-full flex-row divide-x bg-[#f9f9f9]">
        <div className={`w-full lg:w-1/3 ${params.vectorStoreId ? 'hidden lg:block' : ''}`}>
          <VectorStoreSidePanel />
        </div>
        <div className={`w-full lg:w-2/3 ${params.vectorStoreId ? '' : 'hidden lg:block'}`}>
          <div className="m-2 overflow-x-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileDashboardView;
