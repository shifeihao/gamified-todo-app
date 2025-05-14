import React from "react";
import { useToast } from "../context/ToastContext";

const ToastExample = () => {
  const { showSuccess, showError, showInfo } = useToast();

  return (
    <div className="flex gap-4 p-4">
      <button
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        onClick={() => showSuccess("操作成功！")}
      >
        显示成功提示
      </button>

      <button
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        onClick={() => showError("出现错误！")}
      >
        显示错误提示
      </button>

      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() => showInfo("这是一条信息提示！")}
      >
        显示信息提示
      </button>
    </div>
  );
};

export default ToastExample;
