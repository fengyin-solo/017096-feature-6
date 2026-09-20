/**
 * 商家知识页面 - 模块化控制器
 * @module MerchantPage
 */
(function (global) {
  'use strict';

  var Utils = App.Utils;
  var Table = App.Table;
  var Modal = App.Modal;
  var Select = App.Select;

  // ====================== 页面状态 ======================
  var state = {
    merchants: [],
    currentMerchantId: '',
    editingMerchantId: null,
    editingKnowledgeId: null,
    importTab: 'file',
    importParsedItems: [],
    importFileContent: null,
    importFileName: '',
    importSelectedMerchantIds: [],
    importMerchantKeyword: '',
    importPreviewRows: []
  };

  // ====================== DOM 元素缓存 ======================
  var elements = {};

  function cacheElements() {
    elements = {
      // 商家相关
      btnAddMerchant: document.getElementById('btnAddMerchant'),
      merchantTableBody: document.getElementById('merchantTableBody'),
      merchantModal: document.getElementById('merchantModal'),
      merchantModalTitle: document.getElementById('merchantModalTitle'),
      merchantFormIdWrap: document.getElementById('merchantFormIdWrap'),
      merchantFormId: document.getElementById('merchantFormId'),
      merchantFormName: document.getElementById('merchantFormName'),
      merchantModalCancel: document.getElementById('merchantModalCancel'),
      merchantModalSubmit: document.getElementById('merchantModalSubmit'),
      // 知识相关
      merchantSelect: document.getElementById('merchantSelect'),
      btnAddKnowledge: document.getElementById('btnAddKnowledge'),
      knowledgeEmpty: document.getElementById('knowledgeEmpty'),
      knowledgeBlock: document.getElementById('knowledgeBlock'),
      knowledgeTableBody: document.getElementById('knowledgeTableBody'),
      knowledgeModal: document.getElementById('knowledgeModal'),
      knowledgeModalTitle: document.getElementById('knowledgeModalTitle'),
      knowledgeFormMerchantWrap: document.getElementById('knowledgeFormMerchantWrap'),
      knowledgeFormMerchant: document.getElementById('knowledgeFormMerchant'),
      formStandardQ: document.getElementById('formStandardQ'),
      formSimilarQ: document.getElementById('formSimilarQ'),
      formAnswer: document.getElementById('formAnswer'),
      knowledgeModalCancel: document.getElementById('knowledgeModalCancel'),
      knowledgeModalSubmit: document.getElementById('knowledgeModalSubmit'),
      // 批量导入相关
      btnBatchImport: document.getElementById('btnBatchImport'),
      batchImportModal: document.getElementById('batchImportModal'),
      importMerchantKeyword: document.getElementById('importMerchantKeyword'),
      btnSelectAllMerchants: document.getElementById('btnSelectAllMerchants'),
      btnClearMerchants: document.getElementById('btnClearMerchants'),
      importMerchantCount: document.getElementById('importMerchantCount'),
      importMerchantList: document.getElementById('importMerchantList'),
      importTabFile: document.getElementById('importTabFile'),
      importTabText: document.getElementById('importTabText'),
      importFilePanel: document.getElementById('importFilePanel'),
      importTextPanel: document.getElementById('importTextPanel'),
      importFileZone: document.getElementById('importFileZone'),
      importFileInput: document.getElementById('importFileInput'),
      importFileNameEl: document.getElementById('importFileName'),
      importTextArea: document.getElementById('importTextArea'),
      importErrorBox: document.getElementById('importErrorBox'),
      btnParseImport: document.getElementById('btnParseImport'),
      importPreviewSection: document.getElementById('importPreviewSection'),
      importResultSection: document.getElementById('importResultSection'),
      importResultSummary: document.getElementById('importResultSummary'),
      importResultList: document.getElementById('importResultList'),
      importModalAgain: document.getElementById('importModalAgain'),
      importModalDone: document.getElementById('importModalDone'),
      importMerchantChips: document.getElementById('importMerchantChips'),
      importStats: document.getElementById('importStats'),
      importPreviewHeadRow: document.getElementById('importPreviewHeadRow'),
      importPreviewBody: document.getElementById('importPreviewBody'),
      importSelectAll: document.getElementById('importSelectAll'),
      importSelectedCount: document.getElementById('importSelectedCount'),
      importModalCancel: document.getElementById('importModalCancel'),
      importModalCancelNoPreview: document.getElementById('importModalCancelNoPreview'),
      importModalSubmit: document.getElementById('importModalSubmit'),
      importNoPreview: document.getElementById('importNoPreview')
    };
  }

  // ====================== 商家管理 ======================
  var MerchantManager = {
    render: function () {
      state.merchants = MockStore.getMerchants();
      var tbody = elements.merchantTableBody;
      
      Table.render(tbody, state.merchants, function (m) {
        return '<td class="font-mono text-sm text-slate-700">' + Utils.escapeHtml(m.id) + '</td>' +
          '<td class="text-slate-800">' + Utils.escapeHtml(m.name) + '</td>' +
          '<td class="text-right">' +
            '<button type="button" class="btn-link m-edit mr-2" data-id="' + m.id + '">编辑</button>' +
            '<button type="button" class="btn-link btn-link-danger m-delete" data-id="' + m.id + '">删除</button>' +
          '</td>';
      }, this.bindTableEvents.bind(this));
    },

    bindTableEvents: function (tbody) {
      var self = this;
      tbody.querySelectorAll('.m-edit').forEach(function (btn) {
        btn.addEventListener('click', function () {
          self.openModal(btn.dataset.id);
        });
      });
      tbody.querySelectorAll('.m-delete').forEach(function (btn) {
        btn.addEventListener('click', function () {
          Confirm.show('确定删除该商家？其下知识将一并清除。', function () {
            MockStore.deleteMerchant(btn.dataset.id);
            if (state.currentMerchantId === btn.dataset.id) {
              state.currentMerchantId = '';
            }
            self.render();
            self.fillSelect();
            KnowledgeManager.fillFormSelect();
            KnowledgeManager.render();
            Toast.show('商家删除成功', 'success');
          });
        });
      });
    },

    fillSelect: function () {
      state.merchants = MockStore.getMerchants();
      var options = state.merchants.map(function (m) {
        return { value: m.id, label: m.name + '（' + m.id + '）' };
      });
      Select.fill(elements.merchantSelect, options, '全部商家', state.currentMerchantId);
    },

    openModal: function (id) {
      state.editingMerchantId = id || null;
      elements.merchantModalTitle.textContent = id ? '编辑商家' : '新增商家';
      
      if (id) {
        elements.merchantFormIdWrap.style.display = 'block';
        elements.merchantFormId.disabled = true;
        var m = state.merchants.find(function (x) { return x.id === id; });
        if (m) {
          elements.merchantFormId.value = m.id;
          elements.merchantFormName.value = m.name;
        }
      } else {
        elements.merchantFormIdWrap.style.display = 'block';
        elements.merchantFormId.disabled = false;
        elements.merchantFormId.value = '';
        elements.merchantFormName.value = '';
      }
      elements.merchantModal.style.display = 'flex';
    },

    closeModal: function () {
      elements.merchantModal.style.display = 'none';
      state.editingMerchantId = null;
    },

    save: function () {
      var name = elements.merchantFormName.value.trim();
      if (!name) {
        Toast.show('请填写商家名称', 'error');
        return;
      }
      
      if (state.editingMerchantId) {
        MockStore.updateMerchant(state.editingMerchantId, name);
        Toast.show('商家信息更新成功', 'success');
      } else {
        var id = elements.merchantFormId.value.trim();
        MockStore.createMerchant(name, id || undefined);
        Toast.show('商家创建成功', 'success');
      }
      
      this.closeModal();
      this.render();
      this.fillSelect();
      KnowledgeManager.fillFormSelect();
      KnowledgeManager.render();
    }
  };

  // ====================== 知识管理 ======================
  var KnowledgeManager = {
    render: function () {
      var list = [];
      var merchantLabel = {};
      
      MockStore.getMerchants().forEach(function (m) {
        merchantLabel[m.id] = m.name + '（' + m.id + '）';
      });
      
      if (state.currentMerchantId) {
        list = MockStore.getMerchantKnowledge(state.currentMerchantId).map(function (k) {
          return {
            merchantId: state.currentMerchantId,
            merchantName: merchantLabel[state.currentMerchantId] || state.currentMerchantId,
            data: k
          };
        });
      } else {
        MockStore.getMerchants().forEach(function (m) {
          MockStore.getMerchantKnowledge(m.id).forEach(function (k) {
            list.push({
              merchantId: m.id,
              merchantName: merchantLabel[m.id] || m.id,
              data: k
            });
          });
        });
      }

      Table.toggleEmpty(elements.knowledgeEmpty, elements.knowledgeBlock, list.length === 0);
      
      if (list.length === 0) {
        elements.knowledgeTableBody.innerHTML = '';
        return;
      }

      Table.render(elements.knowledgeTableBody, list, function (row) {
        var k = row.data;
        return '<td class="text-subtle text-sm">' + Utils.escapeHtml(row.merchantName) + '</td>' +
          '<td class="text-obsidian">' + Utils.escapeHtml(k.standardQ || '') + '</td>' +
          '<td class="text-subtle">' + Utils.escapeHtml((k.similarQs || []).join('；')) + '</td>' +
          '<td class="text-charcoal max-w-xs truncate">' + Utils.escapeHtml(k.answer || '') + '</td>' +
          '<td class="text-right">' +
            '<button type="button" class="btn-link edit-btn mr-2" data-id="' + k.id + '" data-mid="' + row.merchantId + '">编辑</button>' +
            '<button type="button" class="btn-link btn-link-danger delete-btn" data-id="' + k.id + '" data-mid="' + row.merchantId + '">删除</button>' +
          '</td>';
      }, this.bindTableEvents.bind(this));
    },

    bindTableEvents: function (tbody) {
      var self = this;
      tbody.querySelectorAll('.edit-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var mid = btn.dataset.mid || state.currentMerchantId;
          if (mid) {
            state.currentMerchantId = mid;
            elements.merchantSelect.value = mid;
          }
          self.openModal(btn.dataset.id);
        });
      });
      tbody.querySelectorAll('.delete-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var mid = btn.dataset.mid || state.currentMerchantId;
          Confirm.show('确定删除这条知识？', function () {
            MockStore.deleteMerchantKnowledge(mid, btn.dataset.id);
            self.render();
            Toast.show('知识删除成功', 'success');
          });
        });
      });
    },

    fillFormSelect: function () {
      var merchants = MockStore.getMerchants();
      var options = merchants.map(function (m) {
        return { value: m.id, label: m.name + '（' + m.id + '）' };
      });
      Select.fill(elements.knowledgeFormMerchant, options, '请选择要添加知识的商家');
    },

    openModal: function (id) {
      state.editingKnowledgeId = id || null;
      elements.knowledgeModalTitle.textContent = id ? '编辑知识' : '新增知识';
      
      if (id) {
        elements.knowledgeFormMerchantWrap.style.display = 'none';
        var list = MockStore.getMerchantKnowledge(state.currentMerchantId);
        var k = list.find(function (x) { return x.id === id; });
        if (k) {
          elements.formStandardQ.value = k.standardQ || '';
          elements.formSimilarQ.value = (k.similarQs || []).join('\n');
          elements.formAnswer.value = k.answer || '';
        }
      } else {
        elements.knowledgeFormMerchantWrap.style.display = 'block';
        this.fillFormSelect();
        elements.knowledgeFormMerchant.value = '';
        elements.formStandardQ.value = '';
        elements.formSimilarQ.value = '';
        elements.formAnswer.value = '';
      }
      elements.knowledgeModal.style.display = 'flex';
    },

    closeModal: function () {
      elements.knowledgeModal.style.display = 'none';
      state.editingKnowledgeId = null;
    },

    save: function () {
      var standardQ = elements.formStandardQ.value.trim();
      var similarQs = elements.formSimilarQ.value.trim().split(/\n/).map(function (s) {
        return s.trim();
      }).filter(Boolean);
      var answer = elements.formAnswer.value.trim();
      
      if (!standardQ) {
        Toast.show('请填写标准问', 'error');
        return;
      }
      
      var merchantId = state.editingKnowledgeId
        ? state.currentMerchantId
        : (elements.knowledgeFormMerchant.value || '').trim();
      
      if (!merchantId) {
        Toast.show('请选择要添加知识的商家', 'error');
        return;
      }
      
      if (state.editingKnowledgeId) {
        MockStore.updateMerchantKnowledge(merchantId, state.editingKnowledgeId, {
          standardQ: standardQ,
          similarQs: similarQs,
          answer: answer
        });
        Toast.show('知识更新成功', 'success');
      } else {
        MockStore.addMerchantKnowledge(merchantId, {
          standardQ: standardQ,
          similarQs: similarQs,
          answer: answer
        });
        Toast.show('知识创建成功', 'success');
      }
      
      this.closeModal();
      this.render();
    }
  };

  // ====================== 批量导入管理（一份问答分发多个商家） ======================
  var BatchImportManager = {
    // ---------- 弹层开关 ----------
    openModal: function () {
      state.importParsedItems = [];
      state.importFileContent = null;
      state.importFileName = '';
      state.importTab = 'file';
      state.importMerchantKeyword = '';
      state.importPreviewRows = [];
      // 默认勾选当前筛选的商家，未筛选时不预选
      state.importSelectedMerchantIds = state.currentMerchantId ? [state.currentMerchantId] : [];

      elements.importMerchantKeyword.value = '';
      elements.importTextArea.value = '';
      elements.importFileNameEl.classList.add('hidden');
      elements.importFileNameEl.textContent = '';
      elements.importFileInput.value = '';
      elements.importErrorBox.style.display = 'none';
      elements.importErrorBox.innerHTML = '';
      elements.importPreviewSection.style.display = 'none';
      elements.importResultSection.style.display = 'none';
      elements.importNoPreview.style.display = 'block';
      this.switchTab('file');
      this.renderMerchantList();
      elements.batchImportModal.style.display = 'flex';
    },

    closeModal: function () {
      elements.batchImportModal.style.display = 'none';
      state.importParsedItems = [];
      state.importFileContent = null;
      state.importPreviewRows = [];
    },

    // ---------- 商家多选 ----------
    getSelectedMerchantIds: function () {
      var selected = {};
      state.importSelectedMerchantIds.forEach(function (id) { selected[id] = true; });
      // 只保留仍存在的商家
      return state.merchants
        .map(function (m) { return m.id; })
        .filter(function (id) { return selected[id]; });
    },

    renderMerchantList: function () {
      state.merchants = MockStore.getMerchants();
      var self = this;
      var selected = {};
      state.importSelectedMerchantIds.forEach(function (id) { selected[id] = true; });
      var keyword = (state.importMerchantKeyword || '').trim().toLowerCase();

      var list = state.merchants.filter(function (m) {
        if (!keyword) return true;
        return (m.name || '').toLowerCase().indexOf(keyword) !== -1
          || (m.id || '').toLowerCase().indexOf(keyword) !== -1;
      });

      var container = elements.importMerchantList;
      container.innerHTML = '';

      if (list.length === 0) {
        var empty = document.createElement('div');
        empty.className = 'import-merchant-empty';
        empty.textContent = state.merchants.length === 0 ? '暂无商家，请先在上方新增商家' : '未找到匹配的商家';
        container.appendChild(empty);
      } else {
        list.forEach(function (m) {
          var count = MockStore.getMerchantKnowledge(m.id).length;
          var label = document.createElement('label');
          label.className = 'import-merchant-item';
          label.innerHTML =
            '<input type="checkbox" class="import-merchant-check" value="' + Utils.escapeHtml(m.id) + '"' + (selected[m.id] ? ' checked' : '') + ' />' +
            '<span class="m-name">' + Utils.escapeHtml(m.name) + '</span>' +
            '<span class="m-id">' + Utils.escapeHtml(m.id) + '</span>' +
            '<span class="m-count">已有 ' + count + ' 条</span>';
          container.appendChild(label);
        });

        container.querySelectorAll('.import-merchant-check').forEach(function (cb) {
          cb.addEventListener('change', function () {
            self.onMerchantToggle(cb.value, cb.checked);
          });
        });
      }

      this.updateMerchantCount();
    },

    onMerchantToggle: function (id, checked) {
      var idx = state.importSelectedMerchantIds.indexOf(id);
      if (checked && idx === -1) {
        state.importSelectedMerchantIds.push(id);
      } else if (!checked && idx !== -1) {
        state.importSelectedMerchantIds.splice(idx, 1);
      }
      this.updateMerchantCount();
      // 已有预览时，勾选变化后实时按最新商家重算预览
      if (state.importParsedItems.length > 0) {
        if (this.getSelectedMerchantIds().length === 0) {
          elements.importPreviewSection.style.display = 'none';
          elements.importNoPreview.style.display = 'block';
        } else {
          this.computePreview();
          this.renderPreview();
        }
      }
    },

    selectAllMerchants: function () {
      state.importSelectedMerchantIds = state.merchants.map(function (m) { return m.id; });
      this.renderMerchantList();
      this.afterMerchantSelectionChange();
    },

    clearMerchants: function () {
      state.importSelectedMerchantIds = [];
      this.renderMerchantList();
      this.afterMerchantSelectionChange();
    },

    afterMerchantSelectionChange: function () {
      if (state.importParsedItems.length > 0) {
        if (this.getSelectedMerchantIds().length === 0) {
          elements.importPreviewSection.style.display = 'none';
          elements.importNoPreview.style.display = 'block';
        } else {
          this.computePreview();
          this.renderPreview();
        }
      }
    },

    updateMerchantCount: function () {
      var n = this.getSelectedMerchantIds().length;
      elements.importMerchantCount.textContent = '已选 ' + n + ' 家';
    },

    // ---------- Tab ----------
    switchTab: function (tab) {
      state.importTab = tab;
      if (tab === 'file') {
        elements.importTabFile.classList.add('import-tab-active');
        elements.importTabText.classList.remove('import-tab-active');
        elements.importFilePanel.style.display = 'block';
        elements.importTextPanel.style.display = 'none';
      } else {
        elements.importTabText.classList.add('import-tab-active');
        elements.importTabFile.classList.remove('import-tab-active');
        elements.importFilePanel.style.display = 'none';
        elements.importTextPanel.style.display = 'block';
      }
    },

    // ---------- 文件解析（格式错误精确定位到第几条） ----------

    /**
     * 标准 CSV 解析（RFC4180 子集）：
     * 支持双引号包裹字段、字段内逗号/换行、"" 转义；返回二维数组（物理记录，含引号跨行）
     */
    parseCsvGrid: function (text) {
      var rows = [];
      var row = [];
      var field = '';
      var inQuotes = false;
      var quoted = false; // 当前字段是否曾以引号包裹
      var i = 0;
      var started = false; // 是否已开始一条记录（用于区分文件末尾空字符与空行）

      for (i = 0; i < text.length; i++) {
        var c = text[i];
        started = true;
        if (inQuotes) {
          if (c === '"') {
            if (text[i + 1] === '"') {
              field += '"';
              i++;
            } else {
              inQuotes = false;
            }
          } else {
            field += c;
          }
        } else if (c === '"' && field === '' && !quoted) {
          inQuotes = true;
          quoted = true;
        } else if (c === ',') {
          row.push(field);
          field = '';
          quoted = false;
        } else if (c === '\n') {
          row.push(field);
          rows.push(row);
          row = [];
          field = '';
          quoted = false;
        } else if (c === '\r') {
          if (text[i + 1] === '\n') i++;
          row.push(field);
          rows.push(row);
          row = [];
          field = '';
          quoted = false;
        } else {
          field += c;
        }
      }
      if (started || field.length > 0 || row.length > 0) {
        row.push(field);
        rows.push(row);
      }
      return rows;
    },

    /**
     * 解析 CSV
     * @returns {{items:Array, errors:Array<{index:number, line:number, message:string}>}}
     * 首行为表头（含“标准问/相似问/答案”等）时跳过；序号从第 1 条数据开始，line 为物理行号
     */
    parseCSV: function (text) {
      var grid = this.parseCsvGrid(text);
      // 去掉完全空白的物理记录（不计入条数）
      var lineInfos = [];
      grid.forEach(function (cols, idx) {
        var blank = cols.every(function (c) { return (c || '').trim() === ''; });
        if (!blank) lineInfos.push({ cols: cols, lineNo: idx + 1 });
      });

      var errors = [];
      var items = [];
      if (lineInfos.length === 0) {
        errors.push({ index: 0, line: 0, message: '文件内容为空' });
        return { items: items, errors: errors };
      }

      var startLineIdx = 0;
      var firstCols = lineInfos[0].cols.map(function (c) { return (c || '').trim(); });
      var isHeader = firstCols.some(function (c) {
        return c === '标准问' || c === '相似问' || c === '答案' ||
          c.toLowerCase() === 'standardq' || c.toLowerCase() === 'answer';
      });
      if (isHeader) startLineIdx = 1;

      var recordIndex = 0;
      for (var i = startLineIdx; i < lineInfos.length; i++) {
        recordIndex++;
        var cols = lineInfos[i].cols;
        var lineNo = lineInfos[i].lineNo;
        if (cols.length < 3) {
          errors.push({ index: recordIndex, line: lineNo, message: '第 ' + recordIndex + ' 条（文件第 ' + lineNo + ' 行）格式错误：应为“标准问,相似问,答案”3 列，实际只有 ' + cols.length + ' 列' });
          continue;
        }
        var standardQ = (cols[0] || '').trim();
        var similarQsRaw = (cols[1] || '').trim();
        // 答案允许包含逗号：第 3 列起重新拼回
        var answer = cols.slice(2).join(',').trim();
        if (!standardQ) {
          errors.push({ index: recordIndex, line: lineNo, message: '第 ' + recordIndex + ' 条（文件第 ' + lineNo + ' 行）缺少标准问' });
          continue;
        }
        if (!answer) {
          errors.push({ index: recordIndex, line: lineNo, message: '第 ' + recordIndex + ' 条（文件第 ' + lineNo + ' 行）缺少答案' });
          continue;
        }
        var similarQs = similarQsRaw
          ? similarQsRaw.split(/[;；]/).map(function (s) { return s.trim(); }).filter(Boolean)
          : [];
        items.push({ standardQ: standardQ, similarQs: similarQs, answer: answer });
      }
      return { items: items, errors: errors };
    },

    /**
     * 解析 JSON 数组
     * @returns {{items:Array, errors:Array}}
     */
    parseJSON: function (text) {
      var items = [];
      var errors = [];
      var data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        return { items: items, errors: [{ index: 0, line: 0, message: 'JSON 语法错误：' + (e.message || '无法解析') }] };
      }
      if (!Array.isArray(data)) {
        return { items: items, errors: [{ index: 0, line: 0, message: 'JSON 根节点必须是问答对象数组，例如 [{"standardQ":"...","answer":"..."}]' }] };
      }

      data.forEach(function (item, idx) {
        var index = idx + 1;
        if (item === null || typeof item !== 'object' || Array.isArray(item)) {
          errors.push({ index: index, line: 0, message: '第 ' + index + ' 条格式错误：必须是对象，实际为 ' + (item === null ? 'null' : typeof item) });
          return;
        }
        var standardQ = (item.standardQ != null ? item.standardQ : item['标准问']);
        var answer = (item.answer != null ? item.answer : item['答案']);
        var similarRaw = item.similarQs != null ? item.similarQs : item['相似问'];

        if (typeof standardQ !== 'string') standardQ = standardQ != null ? String(standardQ) : '';
        if (typeof answer !== 'string') answer = answer != null ? String(answer) : '';
        standardQ = standardQ.trim();
        answer = answer.trim();

        if (!standardQ) {
          errors.push({ index: index, line: 0, message: '第 ' + index + ' 条缺少标准问（standardQ）' });
          return;
        }
        if (!answer) {
          errors.push({ index: index, line: 0, message: '第 ' + index + ' 条缺少答案（answer）' });
          return;
        }

        var similarQs = [];
        if (Array.isArray(similarRaw)) {
          similarQs = similarRaw.map(function (s) { return String(s).trim(); }).filter(Boolean);
        } else if (typeof similarRaw === 'string' && similarRaw.trim()) {
          similarQs = similarRaw.split(/[;；\n]/).map(function (s) { return s.trim(); }).filter(Boolean);
        }

        items.push({ standardQ: standardQ, similarQs: similarQs, answer: answer });
      });
      return { items: items, errors: errors };
    },

    /**
     * 解析粘贴文本：标准问|相似问|答案（相似问可省略）
     * @returns {{items:Array, errors:Array}}
     */
    parsePipeText: function (text) {
      var items = [];
      var errors = [];
      var lines = text.split(/\r?\n/);
      var index = 0;
      lines.forEach(function (rawLine, idx) {
        var line = rawLine.trim();
        if (!line) return; // 空行不计入条数
        index++;
        var parts = line.split('|');
        if (parts.length < 2) {
          errors.push({ index: index, line: idx + 1, message: '第 ' + index + ' 条（第 ' + (idx + 1) + ' 行）格式错误：应为“标准问|相似问|答案”，至少需要标准问与答案两列' });
          return;
        }
        var standardQ = parts[0].trim();
        var answer;
        var similarQsRaw = '';
        if (parts.length === 2) {
          answer = parts[1].trim();
        } else {
          similarQsRaw = parts[1].trim();
          answer = parts.slice(2).join('|').trim();
        }
        if (!standardQ) {
          errors.push({ index: index, line: idx + 1, message: '第 ' + index + ' 条（第 ' + (idx + 1) + ' 行）缺少标准问' });
          return;
        }
        if (!answer) {
          errors.push({ index: index, line: idx + 1, message: '第 ' + index + ' 条（第 ' + (idx + 1) + ' 行）缺少答案' });
          return;
        }
        var similarQs = similarQsRaw
          ? similarQsRaw.split(/[;；]/).map(function (s) { return s.trim(); }).filter(Boolean)
          : [];
        items.push({ standardQ: standardQ, similarQs: similarQs, answer: answer });
      });
      if (index === 0) errors.push({ index: 0, line: 0, message: '内容为空' });
      return { items: items, errors: errors };
    },

    handleFileSelect: function (file) {
      if (!file) return;
      state.importFileName = file.name;
      elements.importFileNameEl.textContent = '已选择：' + file.name;
      elements.importFileNameEl.classList.remove('hidden');
      var reader = new FileReader();
      reader.onload = function (e) {
        state.importFileContent = e.target.result;
      };
      reader.readAsText(file);
    },

    /** 解析入口 */
    parseContent: function () {
      var merchantIds = this.getSelectedMerchantIds();
      if (merchantIds.length === 0) {
        Toast.show('请先勾选至少一家要导入的商家', 'error');
        return;
      }

      var parsed;
      var isJson = false;
      if (state.importTab === 'file') {
        if (!state.importFileContent) {
          Toast.show('请先选择文件', 'error');
          return;
        }
        var name = (state.importFileName || '').toLowerCase();
        if (name.endsWith('.json')) {
          isJson = true;
          parsed = this.parseJSON(state.importFileContent);
        } else {
          parsed = this.parseCSV(state.importFileContent);
        }
      } else {
        var text = elements.importTextArea.value.trim();
        if (!text) {
          Toast.show('请粘贴问答内容', 'error');
          return;
        }
        if (text.charAt(0) === '[' || text.charAt(0) === '{') {
          var jsonResult = this.parseJSON(text);
          // 仅当确为 JSON 结构（数组或语法报错）时按 JSON 处理，否则回退到管道文本
          if (jsonResult.errors.length === 0 || text.charAt(0) === '[') {
            isJson = true;
            parsed = jsonResult;
          }
        }
        if (!parsed) {
          parsed = this.parsePipeText(text);
        }
      }

      // 格式错误：指出是第几条，不产生预览、不提交
      if (parsed.errors.length > 0) {
        state.importParsedItems = [];
        state.importPreviewRows = [];
        elements.importPreviewSection.style.display = 'none';
        elements.importResultSection.style.display = 'none';
        elements.importNoPreview.style.display = 'block';
        this.renderErrors(parsed.errors, isJson);
        return;
      }

      if (parsed.items.length === 0) {
        elements.importErrorBox.style.display = 'none';
        Toast.show('未能解析到有效的问答内容，请检查格式', 'error');
        return;
      }

      elements.importErrorBox.style.display = 'none';
      state.importParsedItems = parsed.items.map(function (item, index) {
        return { index: index, item: item, checked: true };
      });
      this.computePreview();
      this.renderPreview();
    },

    renderErrors: function (errors) {
      var box = elements.importErrorBox;
      var html =
        '<div class="import-error-title">' +
          '<span class="iconify" data-icon="lucide:alert-circle" data-width="15" data-height="15"></span>' +
          '文件格式有误，共 ' + errors.length + ' 处问题，已定位到具体条目，请修正后重新解析：' +
        '</div>' +
        '<ul class="import-error-list">' +
          errors.map(function (e) { return '<li>' + Utils.escapeHtml(e.message) + '</li>'; }).join('') +
        '</ul>';
      box.innerHTML = html;
      box.style.display = 'block';
      Toast.show('文件格式有误：' + errors[0].message, 'error');
    },

    // ---------- 预览计算（按商家逐家判重） ----------

    /**
     * 依据“勾选商家 × 勾选问答”计算逐行逐家的写入/跳过状态。
     * 判重规则：该商家已有相同标准问 -> 跳过该家；同一条问答在本批中重复出现 ->
     * 仅第一次出现参与写入，其余在所有商家跳过（与写入存储口径一致）。
     */
    computePreview: function () {
      var merchantIds = this.getSelectedMerchantIds();
      var existingByMerchant = {};
      merchantIds.forEach(function (mid) {
        var map = {};
        MockStore.getMerchantKnowledge(mid).forEach(function (k) {
          map[k.standardQ] = k;
        });
        existingByMerchant[mid] = map;
      });

      // 勾选行之间做批内去重：记录每个标准问第一次出现的行索引
      var firstOccurrence = {};
      var internalFirstMap = {};
      state.importParsedItems.forEach(function (row) {
        if (!row.checked) return;
        var q = row.item.standardQ;
        if (firstOccurrence[q] === undefined) {
          firstOccurrence[q] = row.index;
        } else {
          internalFirstMap[row.index] = firstOccurrence[q];
        }
      });

      var rows = state.importParsedItems.map(function (row) {
        var merchantStatus = {};
        var writeCount = 0;
        var skipExistingCount = 0;
        var isInternalDup = internalFirstMap[row.index] !== undefined;

        merchantIds.forEach(function (mid) {
          if (!row.checked) {
            merchantStatus[mid] = { status: 'off', reason: '未勾选该条问答' };
            return;
          }
          if (isInternalDup) {
            merchantStatus[mid] = {
              status: 'skip',
              reason: '同批第 ' + (internalFirstMap[row.index] + 1) + ' 条已有相同标准问，同批重复'
            };
            return;
          }
          if (existingByMerchant[mid][row.item.standardQ]) {
            merchantStatus[mid] = { status: 'skip', reason: '该商家已有相同标准问，跳过该家，其余商家照常写入' };
            skipExistingCount++;
          } else {
            merchantStatus[mid] = { status: 'write', reason: '' };
            writeCount++;
          }
        });

        return {
          index: row.index,
          item: row.item,
          checked: row.checked,
          isInternalDup: isInternalDup,
          firstIndex: isInternalDup ? internalFirstMap[row.index] : null,
          writeCount: writeCount,
          skipExistingCount: skipExistingCount,
          merchantStatus: merchantStatus
        };
      });

      state.importPreviewRows = rows;
    },

    renderPreview: function () {
      var merchantIds = this.getSelectedMerchantIds();
      elements.importPreviewSection.style.display = 'block';
      elements.importResultSection.style.display = 'none';
      elements.importNoPreview.style.display = 'none';

      this.renderMerchantChips(merchantIds);
      this.renderPreviewHead(merchantIds);
      this.renderPreviewStats(merchantIds);
      this.renderPreviewTable(merchantIds);

      var checkedRows = state.importPreviewRows.filter(function (r) { return r.checked; });
      elements.importSelectAll.checked = checkedRows.length > 0
        && checkedRows.length === state.importPreviewRows.length;
      this.updateSelectedCount();
    },

    renderMerchantChips: function (merchantIds) {
      var merchantMap = {};
      state.merchants.forEach(function (m) { merchantMap[m.id] = m; });

      // 每家写入/跳过统计
      var statsByMerchant = {};
      merchantIds.forEach(function (mid) { statsByMerchant[mid] = { write: 0, skip: 0 }; });
      state.importPreviewRows.forEach(function (row) {
        if (!row.checked || row.isInternalDup) return;
        merchantIds.forEach(function (mid) {
          if (row.merchantStatus[mid].status === 'write') statsByMerchant[mid].write++;
          else if (row.merchantStatus[mid].status === 'skip') statsByMerchant[mid].skip++;
        });
      });

      var html = merchantIds.map(function (mid) {
        var m = merchantMap[mid] || { name: mid };
        var st = statsByMerchant[mid];
        var cls = 'import-chip' + (st.write === 0 ? ' import-chip-skip' : '');
        var icon = st.write > 0 ? 'lucide:check-circle-2' : 'lucide:skip-forward';
        return '<span class="' + cls + '" title="' + Utils.escapeHtml(m.name) + '（' + Utils.escapeHtml(mid) + '）">' +
          '<span class="iconify" data-icon="' + icon + '" data-width="13" data-height="13"></span>' +
          Utils.escapeHtml(m.name) +
          '：写入 ' + st.write + ' 条' + (st.skip > 0 ? '，跳过 ' + st.skip + ' 条' : '') +
        '</span>';
      }).join('');
      elements.importMerchantChips.innerHTML = html;
    },

    renderPreviewHead: function (merchantIds) {
      var merchantMap = {};
      state.merchants.forEach(function (m) { merchantMap[m.id] = m; });
      var headRow = elements.importPreviewHeadRow;
      // 保留前 5 个固定列（全选框/序号/标准问/相似问/答案）
      var fixedThs = headRow.querySelectorAll('th');
      headRow.innerHTML = '';
      for (var i = 0; i < fixedThs.length; i++) {
        headRow.appendChild(fixedThs[i]);
      }
      merchantIds.forEach(function (mid) {
        var th = document.createElement('th');
        th.className = 'mch-col';
        var m = merchantMap[mid];
        th.textContent = m ? m.name : mid;
        th.title = mid;
        headRow.appendChild(th);
      });
      // 重新绑定全选事件（重建表头后 checkbox 为新元素）
      var self = this;
      elements.importSelectAll.onchange = function () {
        self.onSelectAllRows(this.checked);
      };
    },

    renderPreviewStats: function (merchantIds) {
      var checkedRows = state.importPreviewRows.filter(function (r) { return r.checked; });
      var internalDupCount = state.importPreviewRows.filter(function (r) {
        return r.checked && r.isInternalDup;
      }).length;

      var totalWrites = 0;
      var totalSkips = 0;
      checkedRows.forEach(function (row) {
        if (row.isInternalDup) return;
        merchantIds.forEach(function (mid) {
          if (row.merchantStatus[mid].status === 'write') totalWrites++;
          else if (row.merchantStatus[mid].status === 'skip') totalSkips++;
        });
      });

      var html =
        '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium">共写入 ' + totalWrites + ' 份</span>';
      if (totalSkips > 0) {
        html += '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-medium">跳过 ' + totalSkips + ' 家次（已有相同标准问）</span>';
      }
      if (internalDupCount > 0) {
        html += '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-medium">同批重复 ' + internalDupCount + ' 条</span>';
      }
      html += '<span class="text-slate-500">勾选商家 ' + merchantIds.length + ' 家</span>';
      elements.importStats.innerHTML = html;
    },

    renderPreviewTable: function (merchantIds) {
      var tbody = elements.importPreviewBody;
      tbody.innerHTML = '';
      var self = this;

      state.importPreviewRows.forEach(function (row) {
        var k = row.item;
        var tr = document.createElement('tr');
        if (row.isInternalDup && row.checked) {
          tr.className = 'import-row-internal';
        } else if (!row.checked) {
          tr.className = 'import-row-muted';
        }

        var statusCell = '';
        if (row.isInternalDup && row.checked) {
          statusCell = '<td class="text-xs text-rose-600 font-medium" colspan="' + merchantIds.length + '">' +
            '同批与第 ' + (row.firstIndex + 1) + ' 条标准问重复，所有商家均跳过</td>';
        } else {
          merchantIds.forEach(function (mid) {
            var st = row.merchantStatus[mid];
            if (st.status === 'write') {
              statusCell += '<td><span class="cell-status cell-write">' +
                '<span class="iconify" data-icon="lucide:check" data-width="11" data-height="11"></span>写入</span></td>';
            } else if (st.status === 'skip') {
              statusCell += '<td><span class="cell-status cell-skip" title="' + Utils.escapeHtml(st.reason) + '">跳过</span></td>';
            } else {
              statusCell += '<td><span class="cell-status cell-off" title="' + Utils.escapeHtml(st.reason) + '">—</span></td>';
            }
          });
        }

        tr.innerHTML =
          '<td class="text-center"><input type="checkbox" class="import-item-check" data-idx="' + row.index + '"' + (row.checked ? ' checked' : '') + ' /></td>' +
          '<td class="text-slate-400 text-xs">' + (row.index + 1) + '</td>' +
          '<td class="text-slate-800">' + Utils.escapeHtml(k.standardQ) + '</td>' +
          '<td class="text-subtle text-sm">' + Utils.escapeHtml((k.similarQs || []).join('；')) + '</td>' +
          '<td class="text-charcoal max-w-xs truncate" title="' + Utils.escapeHtml(k.answer) + '">' + Utils.escapeHtml(k.answer) + '</td>' +
          statusCell;

        tbody.appendChild(tr);
      });

      tbody.querySelectorAll('.import-item-check').forEach(function (cb) {
        cb.addEventListener('change', function () {
          var idx = parseInt(cb.dataset.idx, 10);
          state.importParsedItems[idx].checked = cb.checked;
          self.computePreview();
          self.renderPreview();
        });
      });
    },

    onSelectAllRows: function (checked) {
      state.importParsedItems.forEach(function (r) { r.checked = checked; });
      this.computePreview();
      this.renderPreview();
    },

    updateSelectedCount: function () {
      var merchantIds = this.getSelectedMerchantIds();
      var checkedCount = state.importParsedItems.filter(function (r) { return r.checked; }).length;
      var totalWrites = 0;
      var totalSkips = 0;
      state.importPreviewRows.forEach(function (row) {
        if (!row.checked || row.isInternalDup) return;
        merchantIds.forEach(function (mid) {
          if (row.merchantStatus[mid].status === 'write') totalWrites++;
          else if (row.merchantStatus[mid].status === 'skip') totalSkips++;
        });
      });
      elements.importSelectedCount.textContent =
        '已勾选 ' + checkedCount + ' 条问答 · 预计写入 ' + totalWrites + ' 份知识' +
        (totalSkips > 0 ? '，跳过 ' + totalSkips + ' 家次' : '');
    },

    // ---------- 提交导入 ----------
    doImport: function () {
      var merchantIds = this.getSelectedMerchantIds();
      // 一家都没勾选：不提交
      if (merchantIds.length === 0) {
        Toast.show('请先勾选至少一家商家', 'error');
        return;
      }

      var selectedItems = state.importParsedItems
        .filter(function (r) { return r.checked; })
        .map(function (r) { return r.item; });

      // 一条都没勾选：不提交
      if (selectedItems.length === 0) {
        Toast.show('请至少勾选一条问答', 'error');
        return;
      }

      // 全部重复（每家每条都只会跳过）：不提交
      var willWrite = false;
      state.importPreviewRows.forEach(function (row) {
        if (!row.checked || row.isInternalDup) return;
        merchantIds.forEach(function (mid) {
          if (row.merchantStatus[mid].status === 'write') willWrite = true;
        });
      });
      if (!willWrite) {
        Toast.show('所选商家均已存在相同标准问，没有可写入的内容，未提交', 'error');
        return;
      }

      var results = MockStore.distributeMerchantKnowledge(merchantIds, selectedItems);
      this.renderResult(merchantIds, results);
    },

    renderResult: function (merchantIds, results) {
      var merchantMap = {};
      state.merchants.forEach(function (m) { merchantMap[m.id] = m; });

      var totalAdded = 0;
      var totalSkipped = 0;
      var errorCount = 0;
      results.forEach(function (r) {
        totalAdded += r.added;
        totalSkipped += r.skipped.length;
        if (r.error) errorCount++;
      });

      elements.importPreviewSection.style.display = 'none';
      elements.importNoPreview.style.display = 'none';
      elements.importResultSection.style.display = 'block';

      var summary = '导入完成：共写入 ' + totalAdded + ' 份知识，覆盖 ' +
        (results.length - errorCount) + ' / ' + results.length + ' 家商家';
      if (totalSkipped > 0) summary += '；跳过 ' + totalSkipped + ' 家次（已有相同标准问/同批重复）';
      if (errorCount > 0) summary += '；' + errorCount + ' 家写入失败（其余商家不受影响）';
      elements.importResultSummary.textContent = summary;

      var html = results.map(function (r) {
        var m = merchantMap[r.merchantId] || { name: r.merchantId };
        var icon;
        var detail;
        var detailCls = 'r-detail';
        if (r.error) {
          icon = '<span class="iconify" data-icon="lucide:x-circle" data-width="16" data-height="16" style="color:#dc2626;"></span>';
          detail = '写入失败：' + Utils.escapeHtml(r.error);
          detailCls += ' r-error';
        } else if (r.added > 0) {
          icon = '<span class="iconify" data-icon="lucide:check-circle-2" data-width="16" data-height="16" style="color:#059669;"></span>';
          detail = '写入 ' + r.added + ' 条' + (r.skipped.length > 0 ? '，跳过 ' + r.skipped.length + ' 条' : '');
        } else {
          var reasons = r.skipped.map(function (s) { return s.reason; });
          var uniqReasons = reasons.filter(function (v, i) { return reasons.indexOf(v) === i; });
          icon = '<span class="iconify" data-icon="lucide:skip-forward" data-width="16" data-height="16" style="color:#d97706;"></span>';
          detail = '全部跳过（' + r.skipped.length + ' 条）';
          detailCls += ' r-error';
          return '<div class="import-result-row">' + icon +
            '<span class="r-name">' + Utils.escapeHtml(m.name) + '</span>' +
            '<span class="m-id text-xs text-slate-400">' + Utils.escapeHtml(r.merchantId) + '</span>' +
            '<span class="' + detailCls + '" title="' + Utils.escapeHtml(uniqReasons.join('；')) + '">' + detail + '</span>' +
          '</div>';
        }
        return '<div class="import-result-row">' + icon +
          '<span class="r-name">' + Utils.escapeHtml(m.name) + '</span>' +
          '<span class="m-id text-xs text-slate-400">' + Utils.escapeHtml(r.merchantId) + '</span>' +
          '<span class="' + detailCls + '" title="">' + detail + '</span>' +
        '</div>';
      }).join('');
      elements.importResultList.innerHTML = html;

      // 已写入的内容立即落盘（distributeMerchantKnowledge 内逐家持久化），刷新列表，重新进入页面仍保留
      state.currentMerchantId = '';
      elements.merchantSelect.value = '';
      MerchantManager.fillSelect();
      KnowledgeManager.fillFormSelect();
      KnowledgeManager.render();

      Toast.show(totalAdded > 0
        ? '成功导入 ' + totalAdded + ' 份知识'
        : '没有可导入的新知识', totalAdded > 0 ? 'success' : 'info');
    }
  };

  // ====================== 事件绑定 ======================
  function bindEvents() {
    // 商家相关
    elements.btnAddMerchant.addEventListener('click', function () {
      MerchantManager.openModal();
    });
    elements.merchantModalCancel.addEventListener('click', function () {
      MerchantManager.closeModal();
    });
    elements.merchantModalSubmit.addEventListener('click', function () {
      MerchantManager.save();
    });
    Modal.bindOverlayClose(elements.merchantModal, function () {
      MerchantManager.closeModal();
    });

    // 知识相关
    elements.merchantSelect.addEventListener('change', function () {
      state.currentMerchantId = elements.merchantSelect.value || '';
      KnowledgeManager.render();
    });
    elements.btnAddKnowledge.addEventListener('click', function () {
      KnowledgeManager.openModal();
    });
    elements.knowledgeModalCancel.addEventListener('click', function () {
      KnowledgeManager.closeModal();
    });
    elements.knowledgeModalSubmit.addEventListener('click', function () {
      KnowledgeManager.save();
    });
    Modal.bindOverlayClose(elements.knowledgeModal, function () {
      KnowledgeManager.closeModal();
    });

    // 批量导入相关
    elements.btnAddKnowledge.parentElement.querySelector('#btnBatchImport').addEventListener('click', function () {
      BatchImportManager.openModal();
    });
    elements.importTabFile.addEventListener('click', function () {
      BatchImportManager.switchTab('file');
    });
    elements.importTabText.addEventListener('click', function () {
      BatchImportManager.switchTab('text');
    });
    elements.importMerchantKeyword.addEventListener('input', function () {
      state.importMerchantKeyword = this.value;
      BatchImportManager.renderMerchantList();
    });
    elements.btnSelectAllMerchants.addEventListener('click', function () {
      BatchImportManager.selectAllMerchants();
    });
    elements.btnClearMerchants.addEventListener('click', function () {
      BatchImportManager.clearMerchants();
    });
    elements.importFileZone.addEventListener('click', function () {
      elements.importFileInput.click();
    });
    elements.importFileInput.addEventListener('change', function () {
      if (this.files && this.files[0]) {
        BatchImportManager.handleFileSelect(this.files[0]);
      }
    });
    elements.importFileZone.addEventListener('dragover', function (e) {
      e.preventDefault();
      e.stopPropagation();
      this.classList.add('import-file-zone-active');
    });
    elements.importFileZone.addEventListener('dragleave', function (e) {
      e.preventDefault();
      e.stopPropagation();
      this.classList.remove('import-file-zone-active');
    });
    elements.importFileZone.addEventListener('drop', function (e) {
      e.preventDefault();
      e.stopPropagation();
      this.classList.remove('import-file-zone-active');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        BatchImportManager.handleFileSelect(e.dataTransfer.files[0]);
      }
    });
    elements.btnParseImport.addEventListener('click', function () {
      BatchImportManager.parseContent();
    });
    elements.importModalCancel.addEventListener('click', function () {
      BatchImportManager.closeModal();
    });
    elements.importModalCancelNoPreview.addEventListener('click', function () {
      BatchImportManager.closeModal();
    });
    elements.importModalSubmit.addEventListener('click', function () {
      BatchImportManager.doImport();
    });
    elements.importModalDone.addEventListener('click', function () {
      BatchImportManager.closeModal();
    });
    elements.importModalAgain.addEventListener('click', function () {
      BatchImportManager.openModal();
    });
    Modal.bindOverlayClose(elements.batchImportModal, function () {
      BatchImportManager.closeModal();
    });
  }

  // ====================== 初始化 ======================
  function init() {
    cacheElements();
    bindEvents();
    MerchantManager.render();
    MerchantManager.fillSelect();
    KnowledgeManager.render();
  }

  // ====================== 导出模块 ======================
  global.MerchantPage = {
    init: init,
    state: state,
    MerchantManager: MerchantManager,
    KnowledgeManager: KnowledgeManager,
    BatchImportManager: BatchImportManager
  };

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window);
