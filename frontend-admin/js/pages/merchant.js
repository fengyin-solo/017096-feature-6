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
    selectedMerchantIds: []
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
      importMerchantPanel: document.getElementById('importMerchantPanel'),
      importMerchantSelectedCount: document.getElementById('importMerchantSelectedCount'),
      btnSelectAllImportMerchants: document.getElementById('btnSelectAllImportMerchants'),
      btnClearImportMerchants: document.getElementById('btnClearImportMerchants'),
      importTabFile: document.getElementById('importTabFile'),
      importTabText: document.getElementById('importTabText'),
      importFilePanel: document.getElementById('importFilePanel'),
      importTextPanel: document.getElementById('importTextPanel'),
      importFileZone: document.getElementById('importFileZone'),
      importFileInput: document.getElementById('importFileInput'),
      importFileNameEl: document.getElementById('importFileName'),
      importTextArea: document.getElementById('importTextArea'),
      btnParseImport: document.getElementById('btnParseImport'),
      importError: document.getElementById('importError'),
      importPreviewSection: document.getElementById('importPreviewSection'),
      importStats: document.getElementById('importStats'),
      importMerchantPreviewBody: document.getElementById('importMerchantPreviewBody'),
      importPreviewBody: document.getElementById('importPreviewBody'),
      importSelectAll: document.getElementById('importSelectAll'),
      importSelectAllMerchants: document.getElementById('importSelectAllMerchants'),
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

  // ====================== 批量导入管理 ======================
  var BatchImportManager = {
    openModal: function () {
      state.importParsedItems = [];
      state.importFileContent = null;
      state.importFileName = '';
      state.importTab = 'file';
      state.selectedMerchantIds = state.currentMerchantId ? [state.currentMerchantId] : [];

      this.renderMerchantPanel();
      elements.importTextArea.value = '';
      elements.importFileNameEl.classList.add('hidden');
      elements.importFileNameEl.textContent = '';
      elements.importFileInput.value = '';
      elements.importPreviewSection.style.display = 'none';
      elements.importNoPreview.style.display = 'block';
      this.hideErrors();
      this.switchTab('file');
      elements.batchImportModal.style.display = 'flex';
    },

    closeModal: function () {
      elements.batchImportModal.style.display = 'none';
      state.importParsedItems = [];
      state.importFileContent = null;
    },

    getMerchants: function () {
      return MockStore.getMerchants();
    },

    getSelectedMerchantIds: function () {
      var selectedMap = {};
      state.selectedMerchantIds.forEach(function (id) { selectedMap[id] = true; });
      return this.getMerchants()
        .map(function (m) { return m.id; })
        .filter(function (id) { return selectedMap[id]; });
    },

    setMerchantSelection: function (ids, shouldRenderPreview, rebuildPanel) {
      var validMap = {};
      this.getMerchants().forEach(function (m) { validMap[m.id] = true; });
      state.selectedMerchantIds = ids.filter(function (id, index, list) {
        return validMap[id] && list.indexOf(id) === index;
      });
      if (rebuildPanel === false) {
        this.syncMerchantPanelStatus();
      } else {
        this.renderMerchantPanel();
      }
      if (shouldRenderPreview && elements.importPreviewSection.style.display === 'block') {
        this.renderPreview();
      }
    },

    syncMerchantPanelStatus: function () {
      var merchants = this.getMerchants();
      elements.importMerchantSelectedCount.textContent = '已选 ' + state.selectedMerchantIds.length + ' 家';
      elements.btnSelectAllImportMerchants.textContent = state.selectedMerchantIds.length === merchants.length && merchants.length > 0 ? '取消全选' : '全选';
      if (elements.importSelectAllMerchants) {
        elements.importSelectAllMerchants.checked = merchants.length > 0 && state.selectedMerchantIds.length === merchants.length;
      }
    },

    renderMerchantPanel: function () {
      var selectedMap = {};
      state.selectedMerchantIds.forEach(function (id) { selectedMap[id] = true; });
      var merchants = this.getMerchants();

      elements.importMerchantPanel.innerHTML = merchants.map(function (m) {
        return '<label class="import-merchant-option">' +
          '<input type="checkbox" class="import-merchant-check" value="' + Utils.escapeHtml(m.id) + '"' + (selectedMap[m.id] ? ' checked' : '') + ' />' +
          '<span class="truncate">' + Utils.escapeHtml(m.name) + '</span>' +
          '<span class="merchant-id ml-auto">' + Utils.escapeHtml(m.id) + '</span>' +
        '</label>';
      }).join('');

      this.syncMerchantPanelStatus();
    },

    switchTab: function (tab) {
      if (state.importTab !== tab) this.resetPreview();
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

    normalizeSimilarQs: function (value) {
      if (Array.isArray(value)) {
        return value.map(function (s) { return String(s).trim(); }).filter(Boolean);
      }
      if (typeof value === 'string' && value.trim()) {
        return value.split(/[;；\n]/).map(function (s) { return s.trim(); }).filter(Boolean);
      }
      return [];
    },

    normalizeItem: function (raw, sourceLabel) {
      var errors = [];
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return { item: null, errors: [sourceLabel + '必须是问答对象'] };
      }

      var standardQ = String(raw.standardQ || raw['标准问'] || '').trim();
      var answer = String(raw.answer || raw['答案'] || '').trim();
      var similarRaw = raw.similarQs !== undefined ? raw.similarQs : raw['相似问'];

      if (typeof similarRaw !== 'string' && !Array.isArray(similarRaw) && similarRaw !== undefined) {
        errors.push(sourceLabel + '的“相似问”必须是字符串或数组');
      }
      if (!standardQ) errors.push(sourceLabel + '缺少“标准问”');
      if (!answer) errors.push(sourceLabel + '缺少“答案”');

      if (errors.length > 0) {
        return { item: null, errors: errors };
      }

      return {
        item: {
          standardQ: standardQ,
          similarQs: this.normalizeSimilarQs(similarRaw),
          answer: answer
        },
        errors: []
      };
    },

    parseCSV: function (text) {
      var normalized = String(text || '').replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      var records = [];
      var row = [];
      var field = '';
      var inQuotes = false;
      var recordStartLine = 1;
      var line = 1;
      var i;

      function finishRecord() {
        row.push(field);
        var isEmpty = row.every(function (value) { return !value.trim(); });
        if (!isEmpty) {
          records.push({ startLine: recordStartLine, columns: row });
        }
        row = [];
        field = '';
        recordStartLine = line + 1;
      }

      for (i = 0; i < normalized.length; i++) {
        var ch = normalized[i];

        if (inQuotes) {
          if (ch === '"') {
            if (normalized[i + 1] === '"') {
              field += '"';
              i++;
            } else {
              inQuotes = false;
            }
          } else if (ch === '\n') {
            field += '\n';
            line++;
          } else {
            field += ch;
          }
        } else if (ch === '"' && field.trim() === '') {
          inQuotes = true;
        } else if (ch === ',') {
          row.push(field);
          field = '';
        } else if (ch === '\n') {
          finishRecord();
          line++;
        } else {
          field += ch;
        }
      }

      if (inQuotes) {
        return { items: [], errors: ['CSV 第 ' + records.length + ' 条存在未闭合的引号'] };
      }
      if (row.length > 0 || field.trim()) finishRecord();

      if (records.length === 0) {
        return { items: [], errors: ['CSV 文件没有有效内容'] };
      }

      var header = records[0].columns.map(function (col) { return col.trim(); });
      if (header[0] !== '标准问' || header[1] !== '相似问' || header[2] !== '答案') {
        return { items: [], errors: ['CSV 表头有误，前三列必须为：标准问,相似问,答案'] };
      }

      var items = [];
      var errors = [];
      for (var r = 1; r < records.length; r++) {
        var cols = records[r].columns;
        var sourceLabel = '第 ' + r + ' 条（文件第 ' + records[r].startLine + ' 行）';

        if (cols.length < 3) {
          errors.push(sourceLabel + '字段不足，应为“标准问、相似问、答案”3 列');
          continue;
        }

        var raw = {
          standardQ: cols[0],
          similarQs: cols[1],
          answer: cols.slice(2).join(',')
        };
        var normalizedResult = this.normalizeItem(raw, 'CSV ' + sourceLabel);
        if (normalizedResult.errors.length) {
          errors = errors.concat(normalizedResult.errors);
        } else {
          items.push({ item: normalizedResult.item, sourceLabel: 'CSV ' + sourceLabel });
        }
      }

      return { items: items, errors: errors };
    },

    parseJSON: function (text) {
      var data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        return { items: [], errors: ['JSON 格式有误，请确认内容为对象数组'] };
      }

      if (!Array.isArray(data)) {
        return { items: [], errors: ['JSON 顶层必须是数组'] };
      }
      if (data.length === 0) {
        return { items: [], errors: ['JSON 数组中没有问答内容'] };
      }

      var items = [];
      var errors = [];
      data.forEach(function (raw, index) {
        var sourceLabel = 'JSON 第 ' + (index + 1) + ' 条';
        var result = this.normalizeItem(raw, sourceLabel);
        if (result.errors.length) {
          errors = errors.concat(result.errors);
        } else {
          items.push({ item: result.item, sourceLabel: sourceLabel });
        }
      }, this);

      return { items: items, errors: errors };
    },

    parseText: function (text) {
      var lines = String(text || '').replace(/^﻿/, '').split(/\r?\n/);
      var items = [];
      var errors = [];
      var entryNo = 0;

      lines.forEach(function (lineValue, index) {
        var line = lineValue.trim();
        if (!line) return;
        entryNo += 1;
        var sourceLabel = '文本第 ' + entryNo + ' 条（第 ' + (index + 1) + ' 行）';
        var parts = line.split('|');

        if (parts.length < 2) {
          errors.push(sourceLabel + '格式有误，应为：标准问|相似问|答案');
          return;
        }

        var raw;
        if (parts.length === 2) {
          raw = { standardQ: parts[0], similarQs: '', answer: parts[1] };
        } else {
          raw = {
            standardQ: parts[0],
            similarQs: parts[1],
            answer: parts.slice(2).join('|')
          };
        }

        var result = this.normalizeItem(raw, sourceLabel);
        if (result.errors.length) {
          errors = errors.concat(result.errors);
        } else {
          items.push({ item: result.item, sourceLabel: sourceLabel });
        }
      }, this);

      if (items.length === 0 && errors.length === 0) {
        errors.push('未能解析到有效的问答内容');
      }
      return { items: items, errors: errors };
    },

    handleFileSelect: function (file) {
      if (!file) return;
      state.importFileName = file.name;
      elements.importFileNameEl.textContent = '已选择：' + file.name;
      elements.importFileNameEl.classList.remove('hidden');
      this.resetPreview();
      var reader = new FileReader();
      reader.onload = function (e) {
        state.importFileContent = e.target.result;
      };
      reader.readAsText(file);
    },

    resetPreview: function () {
      state.importParsedItems = [];
      elements.importPreviewSection.style.display = 'none';
      elements.importNoPreview.style.display = 'block';
      this.hideErrors();
    },

    hideErrors: function () {
      elements.importError.style.display = 'none';
      elements.importError.innerHTML = '';
    },

    showErrors: function (errors) {
      var visibleErrors = errors.slice(0, 5);
      var html = '<div class="import-error-title"><span class="iconify" data-icon="lucide:alert-circle" data-width="16" data-height="16"></span>文件格式有误，请修正后重新解析</div>' +
        '<ul class="list-disc list-inside space-y-1">' +
        visibleErrors.map(function (msg) { return '<li>' + Utils.escapeHtml(msg) + '</li>'; }).join('');

      if (errors.length > visibleErrors.length) {
        html += '<li>另有 ' + (errors.length - visibleErrors.length) + ' 个格式问题</li>';
      }
      html += '</ul>';
      elements.importError.innerHTML = html;
      elements.importError.style.display = 'block';
    },

    parseContent: function () {
      var selectedMerchantIds = this.getSelectedMerchantIds();
      if (selectedMerchantIds.length === 0) {
        Toast.show('请至少勾选一家商家', 'error');
        return;
      }

      var parsed;
      if (state.importTab === 'file') {
        if (!state.importFileContent) {
          Toast.show('请先选择文件', 'error');
          return;
        }
        var name = (state.importFileName || '').toLowerCase();
        parsed = name.endsWith('.json')
          ? this.parseJSON(state.importFileContent)
          : this.parseCSV(state.importFileContent);
      } else {
        var text = elements.importTextArea.value.trim();
        if (!text) {
          Toast.show('请粘贴问答内容', 'error');
          return;
        }
        parsed = /^[\s\r\n]*[\[{]/.test(text) ? this.parseJSON(text) : this.parseText(text);
      }

      this.hideErrors();
      if (parsed.errors.length > 0) {
        state.importParsedItems = [];
        elements.importPreviewSection.style.display = 'none';
        elements.importNoPreview.style.display = 'block';
        this.showErrors(parsed.errors);
        Toast.show(parsed.errors[0], 'error');
        return;
      }
      if (parsed.items.length === 0) {
        Toast.show('未能解析到有效的问答内容，请检查格式', 'error');
        return;
      }

      var seenQ = {};
      state.importParsedItems = parsed.items.map(function (entry, index) {
        var q = entry.item.standardQ;
        var firstIndex = seenQ[q];
        var isInternalDuplicate = firstIndex !== undefined;
        if (!isInternalDuplicate) seenQ[q] = index;
        return {
          index: index,
          sourceLabel: entry.sourceLabel,
          item: entry.item,
          isInternalDuplicate: isInternalDuplicate,
          firstIndex: isInternalDuplicate ? firstIndex : null,
          checked: !isInternalDuplicate
        };
      });

      this.renderPreview();
      Toast.show('解析成功，请确认预览中的商家与问答', 'success');
    },

    buildMerchantPreviewRows: function () {
      var selectedIds = this.getSelectedMerchantIds();
      var selectedItems = state.importParsedItems.filter(function (row) {
        return row.checked && !row.isInternalDuplicate;
      });

      return this.getMerchants()
        .filter(function (m) { return selectedIds.indexOf(m.id) !== -1; })
        .map(function (merchant) {
          var existingQMap = {};
          MockStore.getMerchantKnowledge(merchant.id).forEach(function (k) {
            existingQMap[k.standardQ] = k;
          });

          var writes = [];
          var skips = [];
          selectedItems.forEach(function (row) {
            if (existingQMap[row.item.standardQ]) {
              skips.push(row);
            } else {
              writes.push(row);
            }
          });

          return {
            merchantId: merchant.id,
            merchantName: merchant.name,
            writes: writes,
            skips: skips
          };
        });
    },

    getPlannedWriteCount: function (merchantRows) {
      return merchantRows.reduce(function (sum, row) { return sum + row.writes.length; }, 0);
    },

    renderPreview: function () {
      elements.importPreviewSection.style.display = 'block';
      elements.importNoPreview.style.display = 'none';
      this.hideErrors();

      var merchantRows = this.buildMerchantPreviewRows();
      var plannedWriteCount = this.getPlannedWriteCount(merchantRows);
      var skipCount = merchantRows.reduce(function (sum, row) { return sum + row.skips.length; }, 0);
      var internalCount = state.importParsedItems.filter(function (r) { return r.isInternalDuplicate; }).length;
      var selectedItemCount = state.importParsedItems.filter(function (r) { return r.checked && !r.isInternalDuplicate; }).length;

      var statsHtml =
        '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium">将写入 ' + plannedWriteCount + ' 份</span>' +
        '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">商家 ' + merchantRows.length + ' 家</span>' +
        '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">问答 ' + selectedItemCount + ' 条</span>';
      if (skipCount > 0) {
        statsHtml += '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-medium">重复跳过 ' + skipCount + ' 份</span>';
      }
      if (internalCount > 0) {
        statsHtml += '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-medium">同批重复 ' + internalCount + ' 条</span>';
      }
      elements.importStats.innerHTML = statsHtml;

      this.renderMerchantPreview(merchantRows);
      this.renderItemPreview();
      this.bindPreviewEvents();
      this.updateSelectedCount(merchantRows, plannedWriteCount, skipCount);
      elements.importModalSubmit.disabled = plannedWriteCount === 0;
    },

    renderMerchantPreview: function (merchantRows) {
      var tbody = elements.importMerchantPreviewBody;
      tbody.innerHTML = '';

      if (merchantRows.length === 0) {
        var emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="5" class="text-center text-slate-400 py-4">请先勾选至少一家商家</td>';
        tbody.appendChild(emptyRow);
        elements.importSelectAllMerchants.checked = false;
        return;
      }

      merchantRows.forEach(function (row) {
        var tr = document.createElement('tr');
        if (row.writes.length === 0) tr.className = 'import-merchant-skip-all';
        var reason = row.writes.length > 0
          ? (row.skips.length > 0 ? row.skips.length + ' 条已有相同标准问，仅跳过这些问答' : '—')
          : '所选问答均已有相同标准问，此商家不会写入';
        var skippedQuestions = row.skips.map(function (skipRow) { return skipRow.item.standardQ; });
        var reasonTitle = skippedQuestions.length
          ? '跳过原因：该商家已有相同标准问\n' + skippedQuestions.map(function (q, i) { return (i + 1) + '. ' + q; }).join('\n')
          : '';

        tr.innerHTML =
          '<td><input type="checkbox" class="import-preview-merchant-check" value="' + Utils.escapeHtml(row.merchantId) + '" checked /></td>' +
          '<td>' + Utils.escapeHtml(row.merchantName) + ' <span class="text-xs text-slate-400 font-mono">' + Utils.escapeHtml(row.merchantId) + '</span></td>' +
          '<td class="font-medium text-emerald-700">' + row.writes.length + '</td>' +
          '<td class="' + (row.skips.length ? 'text-amber-700 font-medium' : '') + '">' + row.skips.length + '</td>' +
          '<td class="text-xs" title="' + Utils.escapeHtml(reasonTitle) + '">' + Utils.escapeHtml(reason) + '</td>';
        tbody.appendChild(tr);
      });

      var allMerchants = this.getMerchants();
      elements.importSelectAllMerchants.checked = state.selectedMerchantIds.length === allMerchants.length;
    },

    renderItemPreview: function () {
      var tbody = elements.importPreviewBody;
      tbody.innerHTML = '';

      state.importParsedItems.forEach(function (row) {
        var k = row.item;
        var tr = document.createElement('tr');
        if (row.isInternalDuplicate) tr.className = 'import-dup-row';

        var statusHtml = row.isInternalDuplicate
          ? '<span class="import-badge-internal" title="与' + Utils.escapeHtml(state.importParsedItems[row.firstIndex].sourceLabel) + '标准问相同，不会重复写入">同批重复</span>'
          : '<span class="import-badge-write">有效</span>';

        tr.innerHTML =
          '<td class="text-center"><input type="checkbox" class="import-item-check" data-idx="' + row.index + '"' + (row.checked ? ' checked' : '') + (row.isInternalDuplicate ? ' disabled' : '') + ' /></td>' +
          '<td class="text-xs text-slate-400 whitespace-nowrap">' + Utils.escapeHtml(row.sourceLabel) + '</td>' +
          '<td class="text-slate-800">' + Utils.escapeHtml(k.standardQ) + '</td>' +
          '<td class="text-subtle text-sm">' + Utils.escapeHtml((k.similarQs || []).join('；')) + '</td>' +
          '<td class="text-charcoal max-w-xs truncate" title="' + Utils.escapeHtml(k.answer) + '">' + Utils.escapeHtml(k.answer) + '</td>' +
          '<td>' + statusHtml + '</td>';
        tbody.appendChild(tr);
      });

      var validRows = state.importParsedItems.filter(function (r) { return !r.isInternalDuplicate; });
      elements.importSelectAll.checked = validRows.length > 0 && validRows.every(function (r) { return r.checked; });
    },

    bindPreviewEvents: function () {
      var self = this;

      elements.importPreviewBody.querySelectorAll('.import-item-check').forEach(function (cb) {
        cb.addEventListener('change', function () {
          var idx = parseInt(cb.dataset.idx, 10);
          state.importParsedItems[idx].checked = cb.checked;
          self.renderPreview();
        });
      });

      elements.importMerchantPreviewBody.querySelectorAll('.import-preview-merchant-check').forEach(function (cb) {
        cb.addEventListener('change', function () {
          var nextIds = state.selectedMerchantIds.slice();
          var pos = nextIds.indexOf(cb.value);
          if (cb.checked && pos === -1) {
            nextIds.push(cb.value);
          } else if (!cb.checked && pos !== -1) {
            nextIds.splice(pos, 1);
          }
          self.setMerchantSelection(nextIds, true);
        });
      });

      elements.importSelectAll.onchange = function () {
        var checked = elements.importSelectAll.checked;
        state.importParsedItems.forEach(function (r) {
          if (!r.isInternalDuplicate) r.checked = checked;
        });
        self.renderPreview();
      };

      elements.importSelectAllMerchants.onchange = function () {
        var ids = elements.importSelectAllMerchants.checked
          ? self.getMerchants().map(function (m) { return m.id; })
          : [];
        self.setMerchantSelection(ids, true);
      };
    },

    updateSelectedCount: function (merchantRows, plannedWriteCount, skipCount) {
      var parts = [
        '已选商家 ' + merchantRows.length + ' 家',
        '预计写入 ' + plannedWriteCount + ' 份独立知识'
      ];
      if (skipCount > 0) parts.push('重复跳过 ' + skipCount + ' 份');
      elements.importSelectedCount.textContent = parts.join('，');
    },

    doImport: function () {
      var merchantIds = this.getSelectedMerchantIds();
      if (merchantIds.length === 0) {
        Toast.show('请至少勾选一家商家', 'error');
        return;
      }

      var items = state.importParsedItems
        .filter(function (r) { return r.checked && !r.isInternalDuplicate; })
        .map(function (r) { return r.item; });

      if (items.length === 0) {
        Toast.show('请至少勾选一条有效问答', 'error');
        return;
      }

      var merchantRows = this.buildMerchantPreviewRows();
      if (this.getPlannedWriteCount(merchantRows) === 0) {
        Toast.show('所选商家均已有相同标准问，未提交任何内容', 'error');
        return;
      }

      var result = MockStore.batchAddMerchantKnowledgeForMerchants(merchantIds, items);
      if (result.totalAdded === 0) {
        this.renderPreview();
        Toast.show('导入失败，未写入任何知识；此前已成功导入的内容仍保留', 'error');
        return;
      }

      var message = '成功写入 ' + result.totalAdded + ' 份独立知识';
      if (result.totalSkipped > 0) message += '，重复跳过 ' + result.totalSkipped + ' 份';
      if (result.totalFailed > 0) message += '，' + result.totalFailed + ' 家写入失败';

      this.closeModal();
      state.currentMerchantId = merchantIds.length === 1 ? merchantIds[0] : '';
      elements.merchantSelect.value = state.currentMerchantId;
      MerchantManager.fillSelect();
      KnowledgeManager.fillFormSelect();
      KnowledgeManager.render();
      Toast.show(message, result.totalFailed > 0 ? 'info' : 'success');
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
    elements.importMerchantPanel.addEventListener('change', function (e) {
      var checkbox = e.target.closest ? e.target.closest('.import-merchant-check') : null;
      if (!checkbox) return;
      var ids = Array.prototype.map.call(
        elements.importMerchantPanel.querySelectorAll('.import-merchant-check:checked'),
        function (cb) { return cb.value; }
      );
      BatchImportManager.setMerchantSelection(ids, true, false);
    });
    elements.btnSelectAllImportMerchants.addEventListener('click', function () {
      var merchants = MockStore.getMerchants();
      var ids = state.selectedMerchantIds.length === merchants.length
        ? []
        : merchants.map(function (m) { return m.id; });
      BatchImportManager.setMerchantSelection(ids, true, false);
    });
    elements.btnClearImportMerchants.addEventListener('click', function () {
      BatchImportManager.setMerchantSelection([], true);
    });
    elements.importTabFile.addEventListener('click', function () {
      BatchImportManager.switchTab('file');
    });
    elements.importTabText.addEventListener('click', function () {
      BatchImportManager.switchTab('text');
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
    elements.importTextArea.addEventListener('input', function () {
      BatchImportManager.resetPreview();
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
